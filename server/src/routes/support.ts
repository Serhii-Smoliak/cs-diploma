import { Router } from 'express';
import { z } from 'zod';
import prisma from '../db/database.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  countUserTicketsToday,
  formatSupportMessage,
  formatSupportTicket,
  getDailyTicketLimit,
} from '../services/supportService.js';
import { requireRouteParam } from '../utils/routeParams.js';

const router = Router();

router.use(authenticate);

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(5000),
});

router.get('/tickets/limit', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const usedToday = await countUserTicketsToday(userId, prisma);
    const limit = getDailyTicketLimit();

    res.json({
      limit,
      usedToday,
      remainingToday: Math.max(0, limit - usedToday),
    });
  } catch (error) {
    console.error('Error fetching support ticket limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tickets', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const tickets = await prisma.supportTicket.findMany({
      where: { userId },
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      tickets.map((ticket) => ({
        ...formatSupportTicket(ticket),
        messagePreview: ticket.message.slice(0, 120),
      }))
    );
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tickets/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = requireRouteParam(req.params.id);

    const ticket = await prisma.supportTicket.findFirst({
      where: { id, userId },
      include: {
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
      ...formatSupportTicket(ticket),
      messages: ticket.messages.map(formatSupportMessage),
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/tickets', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { subject, message } = createTicketSchema.parse(req.body);
    const usedToday = await countUserTicketsToday(userId, prisma);

    if (usedToday >= getDailyTicketLimit()) {
      return res.status(429).json({
        error: 'Daily support ticket limit reached',
        limit: getDailyTicketLimit(),
        usedToday,
      });
    }

    const ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({
        data: {
          userId,
          subject,
          message,
        },
      });

      await tx.supportMessage.create({
        data: {
          ticketId: created.id,
          authorId: userId,
          body: message,
          isStaffReply: false,
        },
      });

      return created;
    });

    res.status(201).json(formatSupportTicket(ticket));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating support ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
