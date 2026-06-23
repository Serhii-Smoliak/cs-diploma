import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRequest } from '../middleware/auth.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  notification: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

const authState = vi.hoisted(() => ({ userId: 'user-1' as string | undefined }));

vi.mock('../db/database.js', () => ({ default: prismaMock }));

vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: AuthRequest, _res: unknown, next: () => void) => {
    req.userId = authState.userId;
    next();
  },
}));

import notificationsRouter from './notifications.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', notificationsRouter);
  return app;
}

describe('notifications routes', () => {
  beforeEach(() => {
    authState.userId = 'user-1';
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ preferredLocale: 'uk' });
    prismaMock.notification.findMany.mockResolvedValue([
      {
        id: 'notif-1',
        userId: 'user-1',
        type: 'SUPPORT_REPLY',
        title: 'notification.supportReply.title',
        body: 'msg-1',
        link: '/support',
        isRead: false,
        createdAt: new Date('2026-06-23T10:00:00.000Z'),
        supportMessage: { ticket: { subject: 'Help' } },
        newsPost: null,
      },
    ]);
    prismaMock.notification.count.mockResolvedValue(1);
    prismaMock.notification.findFirst.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      type: 'SUPPORT_REPLY',
      title: 'Support reply',
      body: 'New reply on: Help',
      link: '/support',
      isRead: false,
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
    });
    prismaMock.notification.update.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      type: 'SUPPORT_REPLY',
      title: 'Support reply',
      body: 'New reply on: Help',
      link: '/support',
      isRead: true,
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
    });
    prismaMock.notification.updateMany.mockResolvedValue({ count: 1 });
  });

  it('GET / returns latest notifications', async () => {
    const response = await request(createApp()).get('/api/notifications');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].isRead).toBe(false);
    expect(response.body[0].supportSubject).toBe('Help');
    expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 5, where: { userId: 'user-1' } })
    );
  });

  it('GET /unread-count returns unread count', async () => {
    const response = await request(createApp()).get('/api/notifications/unread-count');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ count: 1 });
  });

  it('PATCH /:id/read marks notification as read', async () => {
    const response = await request(createApp()).patch('/api/notifications/notif-1/read');

    expect(response.status).toBe(200);
    expect(response.body.isRead).toBe(true);
    expect(prismaMock.notification.update).toHaveBeenCalled();
  });

  it('PATCH /read-all marks all notifications as read', async () => {
    const response = await request(createApp()).patch('/api/notifications/read-all');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(prismaMock.notification.updateMany).toHaveBeenCalled();
  });
});
