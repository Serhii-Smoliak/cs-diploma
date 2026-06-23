import { Router } from 'express';
import { z } from 'zod';
import {
  UserRole,
  SupportTicketStatus,
  SupportTicketCloseReason,
  NotificationType,
} from '@prisma/client';
import prisma from '../db/database.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { syncMitreTechniques } from '../services/mitreSyncService.js';
import { getMitreTranslationCoverage } from '../services/mitreTranslationCoverage.js';
import { formatSupportMessage, formatSupportTicket } from '../services/supportService.js';
import {
  deleteLegacySupportReplyNotification,
  getSupportReplyNotificationData,
} from '../services/notificationService.js';
import { formatNewsPost, notifyAllUsersAboutNews } from '../services/newsService.js';

const router = Router();

router.use(authenticate, requireAdmin);

const blockUserSchema = z.object({
  blocked: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});

const supportReplySchema = z.object({
  body: z.string().trim().min(1).max(5000),
});

const supportCloseSchema = z
  .object({
    reason: z.nativeEnum(SupportTicketCloseReason),
    reasonText: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reason === SupportTicketCloseReason.CUSTOM) {
      if (!data.reasonText || data.reasonText.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Custom reason must be at least 3 characters',
          path: ['reasonText'],
        });
      }
    }
  });

const newsPostSchema = z.object({
  titleUk: z.string().trim().min(3).max(200),
  titleEn: z.string().trim().min(3).max(200),
  bodyUk: z.string().trim().min(10).max(10000),
  bodyEn: z.string().trim().min(10).max(10000),
  isPublished: z.boolean().optional(),
});

const newsPostUpdateSchema = newsPostSchema.partial();

async function getEditableStaffMessage(messageId: string, adminId: string) {
  const message = await prisma.supportMessage.findUnique({
    where: { id: messageId },
    include: {
      ticket: { select: { id: true, status: true, userId: true, subject: true } },
      author: { select: { username: true } },
    },
  });

  if (!message) {
    return { error: 'Message not found', status: 404 as const };
  }
  if (!message.isStaffReply) {
    return { error: 'Cannot modify user messages', status: 403 as const };
  }
  if (message.authorId !== adminId) {
    return { error: 'Cannot modify another admin reply', status: 403 as const };
  }
  if (message.ticket.status === SupportTicketStatus.CLOSED) {
    return { error: 'Ticket is closed', status: 400 as const };
  }

  return { message };
}

router.get('/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        xp: true,
        rank: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
        createdAt: true,
        stats: {
          select: {
            totalXp: true,
            rank: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { username: 'asc' }],
    });

    res.json(
      users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        xp: user.stats?.totalXp ?? user.xp,
        rank: user.stats?.rank ?? user.rank,
        isBlocked: user.isBlocked,
        blockedAt: user.blockedAt?.toISOString() ?? null,
        blockedReason: user.blockedReason,
        createdAt: user.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/users/:id/block', async (req: AuthRequest, res) => {
  try {
    const adminId = req.userId!;
    const { id } = req.params;
    const { blocked, reason } = blockUserSchema.parse(req.body);

    if (id === adminId) {
      return res.status(400).json({ error: 'Cannot block your own account' });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (existing.role === UserRole.ADMIN && blocked) {
      return res.status(400).json({ error: 'Cannot block admin accounts' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBlocked: blocked,
        blockedAt: blocked ? new Date() : null,
        blockedReason: blocked ? (reason ?? null) : null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        xp: true,
        rank: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
        createdAt: true,
      },
    });

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      xp: user.xp,
      rank: user.rank,
      isBlocked: user.isBlocked,
      blockedAt: user.blockedAt?.toISOString() ?? null,
      blockedReason: user.blockedReason,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating user block status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/mitre/stats', async (_req, res) => {
  try {
    const stats = await getMitreTranslationCoverage();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching MITRE admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/mitre/sync', async (_req, res) => {
  try {
    const result = await syncMitreTechniques();
    const coverage = await getMitreTranslationCoverage();

    res.json({
      success: true,
      message: `Synchronized ${result.synced} techniques`,
      synced: result.synced,
      errors: result.errors,
      coverage,
    });
  } catch (error) {
    console.error('MITRE admin sync error:', error);
    res.status(500).json({ success: false, error: 'Sync failed' });
  }
});

router.get('/support/tickets', async (_req, res) => {
  try {
    const tickets = await prisma.supportTicket.findMany({
      include: {
        user: { select: { username: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      tickets.map((ticket) => ({
        ...formatSupportTicket({
          ...ticket,
          user: ticket.user,
        }),
        messagePreview: ticket.message.slice(0, 120),
      }))
    );
  } catch (error) {
    console.error('Error fetching admin support tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/support/tickets/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, email: true } },
        messages: {
          include: { author: { select: { username: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({
      ...formatSupportTicket({
        ...ticket,
        user: ticket.user,
      }),
      messages: ticket.messages.map(formatSupportMessage),
    });
  } catch (error) {
    console.error('Error fetching admin support ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/support/tickets/:id/reply', async (req: AuthRequest, res) => {
  try {
    const adminId = req.userId!;
    const { id } = req.params;
    const { body } = supportReplySchema.parse(req.body);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, userId: true, subject: true, status: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === SupportTicketStatus.CLOSED) {
      return res.status(400).json({ error: 'Ticket is closed' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          authorId: adminId,
          body,
          isStaffReply: true,
        },
        include: { author: { select: { username: true } } },
      });

      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: { status: SupportTicketStatus.ANSWERED },
      });

      await tx.notification.create({
        data: {
          userId: ticket.userId,
          type: NotificationType.SUPPORT_REPLY,
          ...getSupportReplyNotificationData(message.id),
          supportMessageId: message.id,
        },
      });

      return message;
    });

    res.json(formatSupportMessage(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error replying to support ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/support/tickets/:id/close', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { reason, reasonText } = supportCloseSchema.parse(req.body);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.status === SupportTicketStatus.CLOSED) {
      return res.status(400).json({ error: 'Ticket is already closed' });
    }

    const updated = await prisma.supportTicket.update({
      where: { id },
      data: {
        status: SupportTicketStatus.CLOSED,
        closedAt: new Date(),
        closeReason: reason,
        closeReasonText: reason === SupportTicketCloseReason.CUSTOM ? reasonText : null,
      },
      include: {
        user: { select: { username: true, email: true } },
        messages: {
          include: { author: { select: { username: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    res.json({
      ...formatSupportTicket({
        ...updated,
        user: updated.user,
      }),
      messages: updated.messages.map(formatSupportMessage),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error closing support ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/support/messages/:messageId', async (req: AuthRequest, res) => {
  try {
    const adminId = req.userId!;
    const { messageId } = req.params;
    const { body } = supportReplySchema.parse(req.body);

    const lookup = await getEditableStaffMessage(messageId, adminId);
    if ('error' in lookup) {
      return res.status(lookup.status).json({ error: lookup.error });
    }

    const updated = await prisma.supportMessage.update({
      where: { id: messageId },
      data: { body },
      include: { author: { select: { username: true } } },
    });

    res.json(formatSupportMessage(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating support message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/support/messages/:messageId', async (req: AuthRequest, res) => {
  try {
    const adminId = req.userId!;
    const { messageId } = req.params;

    const lookup = await getEditableStaffMessage(messageId, adminId);
    if ('error' in lookup) {
      return res.status(lookup.status).json({ error: lookup.error });
    }

    const ticketId = lookup.message.ticket.id;
    const ticketUserId = lookup.message.ticket.userId;
    const ticketSubject = lookup.message.ticket.subject;
    const messageCreatedAt = lookup.message.createdAt;

    await prisma.$transaction(async (tx) => {
      await deleteLegacySupportReplyNotification(tx, {
        ticketUserId,
        ticketSubject,
        messageCreatedAt,
      });

      await tx.supportMessage.delete({ where: { id: messageId } });

      const remainingStaffReplies = await tx.supportMessage.count({
        where: { ticketId, isStaffReply: true },
      });

      if (remainingStaffReplies === 0) {
        await tx.supportTicket.update({
          where: { id: ticketId },
          data: { status: SupportTicketStatus.OPEN },
        });
      }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting support message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/news', async (_req, res) => {
  try {
    const posts = await prisma.newsPost.findMany({
      include: { author: { select: { username: true } } },
      orderBy: [{ createdAt: 'desc' }],
    });

    res.json(posts.map((post) => formatNewsPost(post, 'uk')));
  } catch (error) {
    console.error('Error fetching admin news posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/news', async (req: AuthRequest, res) => {
  try {
    const adminId = req.userId!;
    const data = newsPostSchema.parse(req.body);
    const shouldPublish = data.isPublished === true;

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.newsPost.create({
        data: {
          titleUk: data.titleUk,
          titleEn: data.titleEn,
          bodyUk: data.bodyUk,
          bodyEn: data.bodyEn,
          isPublished: shouldPublish,
          publishedAt: shouldPublish ? new Date() : null,
          authorId: adminId,
        },
        include: { author: { select: { username: true } } },
      });

      if (shouldPublish) {
        await notifyAllUsersAboutNews(tx, created.id);
      }

      return created;
    });

    res.status(201).json(formatNewsPost(post, 'uk'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating news post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/news/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = newsPostUpdateSchema.parse(req.body);

    const existing = await prisma.newsPost.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'News post not found' });
    }

    const publishingNow = data.isPublished === true && !existing.isPublished;

    const post = await prisma.$transaction(async (tx) => {
      const updated = await tx.newsPost.update({
        where: { id },
        data: {
          ...(data.titleUk !== undefined ? { titleUk: data.titleUk } : {}),
          ...(data.titleEn !== undefined ? { titleEn: data.titleEn } : {}),
          ...(data.bodyUk !== undefined ? { bodyUk: data.bodyUk } : {}),
          ...(data.bodyEn !== undefined ? { bodyEn: data.bodyEn } : {}),
          ...(data.isPublished !== undefined ? { isPublished: data.isPublished } : {}),
          ...(publishingNow ? { publishedAt: new Date() } : {}),
          ...(data.isPublished === false ? { publishedAt: null } : {}),
        },
        include: { author: { select: { username: true } } },
      });

      if (publishingNow) {
        await notifyAllUsersAboutNews(tx, updated.id);
      }

      return updated;
    });

    res.json(formatNewsPost(post, 'uk'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating news post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/news/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.newsPost.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'News post not found' });
    }

    await prisma.newsPost.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting news post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
