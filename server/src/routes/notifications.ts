import { Router } from 'express';
import prisma from '../db/database.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { formatNotification, NOTIFICATION_LIST_LIMIT } from '../services/notificationService.js';
import { resolveNewsLocale } from '../services/newsService.js';

const router = Router();

router.use(authenticate);

router.get('/unread-count', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching notification unread count:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLocale: true },
    });
    const locale = resolveNewsLocale(user?.preferredLocale);

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        supportMessage: { select: { ticket: { select: { subject: true } } } },
        newsPost: { select: { titleUk: true, titleEn: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: NOTIFICATION_LIST_LIMIT,
    });

    res.json(notifications.map((notification) => formatNotification(notification, locale)));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/read-all', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/read', async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
      include: {
        supportMessage: { select: { ticket: { select: { subject: true } } } },
        newsPost: { select: { titleUk: true, titleEn: true } },
      },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLocale: true },
    });
    const locale = resolveNewsLocale(user?.preferredLocale);

    if (notification.isRead) {
      return res.json(formatNotification(notification, locale));
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        supportMessage: { select: { ticket: { select: { subject: true } } } },
        newsPost: { select: { titleUk: true, titleEn: true } },
      },
    });

    res.json(formatNotification(updated, locale));
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
