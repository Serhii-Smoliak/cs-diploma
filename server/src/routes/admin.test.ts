import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  mitreTechnique: {
    findMany: vi.fn(),
  },
  translation: {
    findMany: vi.fn(),
  },
  supportTicket: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  supportMessage: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  notification: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  newsPost: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const syncMock = vi.hoisted(() => ({
  syncMitreTechniques: vi.fn(),
}));

const authState = vi.hoisted(() => ({ userId: 'admin-1' as string | undefined }));

vi.mock('../db/database.js', () => ({ default: prismaMock }));

vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: AuthRequest, _res: unknown, next: () => void) => {
    req.userId = authState.userId;
    next();
  },
}));

vi.mock('../middleware/requireAdmin.js', () => ({
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../services/mitreSyncService.js', () => syncMock);

import adminRouter from './admin.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin', adminRouter);
  return app;
}

describe('admin routes', () => {
  beforeEach(() => {
    authState.userId = 'admin-1';
    vi.clearAllMocks();
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        username: 'agent',
        email: 'agent@test.com',
        role: UserRole.USER,
        xp: 100,
        rank: 'Novice Hacker',
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        stats: { totalXp: 100, rank: 'Novice Hacker' },
      },
    ]);
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: UserRole.USER,
    });
    prismaMock.user.update.mockResolvedValue({
      id: 'user-1',
      username: 'agent',
      email: 'agent@test.com',
      role: UserRole.USER,
      xp: 100,
      rank: 'Novice Hacker',
      isBlocked: true,
      blockedAt: new Date('2026-06-23T00:00:00.000Z'),
      blockedReason: 'abuse',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prismaMock.mitreTechnique.findMany.mockResolvedValue([
      {
        id: 'T1593',
        tactic: 'Reconnaissance',
        name: 'Search Open Websites/Domains',
        description: 'MITRE description',
      },
      {
        id: 'T1005',
        tactic: 'Collection',
        name: 'Data from Local System',
        description: 'MITRE description',
      },
    ]);
    prismaMock.translation.findMany.mockResolvedValue([
      { key: 'technique.name.T1593', locale: 'uk' },
      { key: 'technique.description.T1593', locale: 'uk' },
      { key: 'technique.name.T1593', locale: 'en' },
      { key: 'technique.description.T1593', locale: 'en' },
      { key: 'tactic.explanation.Collection', locale: 'uk' },
      { key: 'killChain.goal.collection', locale: 'uk' },
    ]);
    syncMock.syncMitreTechniques.mockResolvedValue({ synced: 2, errors: 0 });
    prismaMock.supportTicket.findMany.mockResolvedValue([]);
    prismaMock.supportTicket.findUnique.mockResolvedValue({
      id: 'ticket-1',
      userId: 'user-1',
      subject: 'Help',
      message: 'Need help',
      status: 'OPEN',
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
      updatedAt: new Date('2026-06-23T10:00:00.000Z'),
      user: { username: 'agent', email: 'agent@test.com' },
      messages: [],
    });
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        supportMessage: prismaMock.supportMessage,
        supportTicket: prismaMock.supportTicket,
        notification: prismaMock.notification,
        newsPost: prismaMock.newsPost,
        user: prismaMock.user,
      })
    );
    prismaMock.supportMessage.create.mockResolvedValue({
      id: 'msg-1',
      authorId: 'admin-1',
      body: 'We are looking into it',
      isStaffReply: true,
      createdAt: new Date('2026-06-23T11:00:00.000Z'),
      author: { username: 'admin' },
    });
    prismaMock.supportMessage.findUnique.mockResolvedValue({
      id: 'msg-1',
      authorId: 'admin-1',
      body: 'We are looking into it',
      isStaffReply: true,
      createdAt: new Date('2026-06-23T11:00:00.000Z'),
      ticket: { id: 'ticket-1', status: 'OPEN', userId: 'user-1', subject: 'Help' },
      author: { username: 'admin' },
    });
    prismaMock.supportMessage.update.mockResolvedValue({
      id: 'msg-1',
      authorId: 'admin-1',
      body: 'Updated reply',
      isStaffReply: true,
      createdAt: new Date('2026-06-23T11:00:00.000Z'),
      author: { username: 'admin' },
    });
    prismaMock.supportMessage.count.mockResolvedValue(0);
    prismaMock.notification.createMany.mockResolvedValue({ count: 1 });
    prismaMock.notification.findMany.mockResolvedValue([]);
    prismaMock.notification.delete.mockResolvedValue({});
    prismaMock.newsPost.findMany.mockResolvedValue([]);
    prismaMock.newsPost.findUnique.mockResolvedValue(null);
    prismaMock.newsPost.create.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: true,
      publishedAt: new Date('2026-06-23T12:00:00.000Z'),
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
      author: { username: 'admin' },
    });
    prismaMock.newsPost.update.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: true,
      publishedAt: new Date('2026-06-23T12:00:00.000Z'),
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
      author: { username: 'admin' },
    });
    prismaMock.newsPost.delete.mockResolvedValue({});
    prismaMock.supportTicket.update.mockResolvedValue({
      id: 'ticket-1',
      userId: 'user-1',
      subject: 'Help',
      message: 'Need help',
      status: 'CLOSED',
      closedAt: new Date('2026-06-23T12:00:00.000Z'),
      closeReason: 'DECLINED',
      closeReasonText: null,
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
      user: { username: 'agent', email: 'agent@test.com' },
      messages: [],
    });
  });

  it('GET /users returns admin user list', async () => {
    const response = await request(createApp()).get('/api/admin/users');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].username).toBe('agent');
  });

  it('PATCH /users/:id/block blocks user', async () => {
    const response = await request(createApp())
      .patch('/api/admin/users/user-1/block')
      .send({ blocked: true, reason: 'abuse' });

    expect(response.status).toBe(200);
    expect(response.body.isBlocked).toBe(true);
  });

  it('PATCH /users/:id/block rejects self block', async () => {
    const response = await request(createApp())
      .patch('/api/admin/users/admin-1/block')
      .send({ blocked: true });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot block your own account');
  });

  it('GET /mitre/stats returns coverage summary', async () => {
    const response = await request(createApp()).get('/api/admin/mitre/stats');

    expect(response.status).toBe(200);
    expect(response.body.totalTechniques).toBe(2);
    expect(response.body.uk).toEqual({ full: 1, partial: 1, none: 0 });
    expect(response.body.en.full).toBe(2);
  });

  it('POST /mitre/sync runs sync and returns coverage', async () => {
    const response = await request(createApp()).post('/api/admin/mitre/sync');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(syncMock.syncMitreTechniques).toHaveBeenCalled();
    expect(response.body.coverage.totalTechniques).toBe(2);
  });

  it('GET /support/tickets returns admin ticket list', async () => {
    prismaMock.supportTicket.findMany.mockResolvedValue([
      {
        id: 'ticket-1',
        subject: 'Help',
        message: 'Need help',
        status: 'OPEN',
        createdAt: new Date('2026-06-23T10:00:00.000Z'),
        updatedAt: new Date('2026-06-23T10:00:00.000Z'),
        user: { username: 'agent', email: 'agent@test.com' },
      },
    ]);

    const response = await request(createApp()).get('/api/admin/support/tickets');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].username).toBe('agent');
  });

  it('POST /support/tickets/:id/reply creates staff reply', async () => {
    const response = await request(createApp())
      .post('/api/admin/support/tickets/ticket-1/reply')
      .send({ body: 'We are looking into it' });

    expect(response.status).toBe(200);
    expect(response.body.isStaffReply).toBe(true);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('POST /support/tickets/:id/close closes ticket with reason', async () => {
    const response = await request(createApp())
      .post('/api/admin/support/tickets/ticket-1/close')
      .send({ reason: 'DECLINED' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('CLOSED');
    expect(response.body.closeReason).toBe('DECLINED');
    expect(prismaMock.supportTicket.update).toHaveBeenCalled();
  });

  it('POST /support/tickets/:id/close requires custom reason text', async () => {
    const response = await request(createApp())
      .post('/api/admin/support/tickets/ticket-1/close')
      .send({ reason: 'CUSTOM' });

    expect(response.status).toBe(400);
  });

  it('PATCH /support/messages/:messageId updates own staff reply', async () => {
    const response = await request(createApp())
      .patch('/api/admin/support/messages/msg-1')
      .send({ body: 'Updated reply' });

    expect(response.status).toBe(200);
    expect(response.body.body).toBe('Updated reply');
    expect(prismaMock.supportMessage.update).toHaveBeenCalled();
  });

  it('PATCH /support/messages/:messageId rejects another admin reply', async () => {
    prismaMock.supportMessage.findUnique.mockResolvedValue({
      id: 'msg-1',
      authorId: 'admin-2',
      body: 'Other admin reply',
      isStaffReply: true,
      createdAt: new Date('2026-06-23T11:00:00.000Z'),
      ticket: { id: 'ticket-1', status: 'OPEN', userId: 'user-1', subject: 'Help' },
      author: { username: 'other-admin' },
    });

    const response = await request(createApp())
      .patch('/api/admin/support/messages/msg-1')
      .send({ body: 'Updated reply' });

    expect(response.status).toBe(403);
  });

  it('DELETE /support/messages/:messageId deletes own staff reply', async () => {
    const response = await request(createApp()).delete('/api/admin/support/messages/msg-1');

    expect(response.status).toBe(204);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('POST /news creates published news and notifies users', async () => {
    prismaMock.user.findMany.mockResolvedValueOnce([{ id: 'user-1' }, { id: 'user-2' }]);

    const response = await request(createApp()).post('/api/admin/news').send({
      titleUk: 'Новина платформи',
      titleEn: 'Platform news',
      bodyUk: 'Текст новини українською',
      bodyEn: 'News text in English',
      isPublished: true,
    });

    expect(response.status).toBe(201);
    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(prismaMock.notification.createMany).toHaveBeenCalled();
  });

  it('GET /news returns admin news list', async () => {
    prismaMock.newsPost.findMany.mockResolvedValue([
      {
        id: 'news-1',
        titleUk: 'Новина',
        titleEn: 'News',
        bodyUk: 'Текст',
        bodyEn: 'Text',
        isPublished: false,
        publishedAt: null,
        authorId: 'admin-1',
        createdAt: new Date('2026-06-23T12:00:00.000Z'),
        updatedAt: new Date('2026-06-23T12:00:00.000Z'),
        author: { username: 'admin' },
      },
    ]);

    const response = await request(createApp()).get('/api/admin/news');

    expect(response.status).toBe(200);
    expect(response.body[0].titleUk).toBe('Новина');
  });

  it('PATCH /news/:id publishes draft and notifies users', async () => {
    prismaMock.newsPost.findUnique.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: false,
      publishedAt: null,
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
    });

    const response = await request(createApp())
      .patch('/api/admin/news/news-1')
      .send({ isPublished: true });

    expect(response.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('PATCH /news/:id returns 404 for missing post', async () => {
    prismaMock.newsPost.findUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .patch('/api/admin/news/missing')
      .send({ titleUk: 'Updated' });

    expect(response.status).toBe(404);
  });

  it('DELETE /news/:id removes post', async () => {
    prismaMock.newsPost.findUnique.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: true,
      publishedAt: new Date('2026-06-23T12:00:00.000Z'),
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
    });

    const response = await request(createApp()).delete('/api/admin/news/news-1');

    expect(response.status).toBe(204);
    expect(prismaMock.newsPost.delete).toHaveBeenCalled();
  });

  it('GET /support/tickets/:id returns ticket detail', async () => {
    const response = await request(createApp()).get('/api/admin/support/tickets/ticket-1');

    expect(response.status).toBe(200);
    expect(response.body.subject).toBe('Help');
  });

  it('POST /support/tickets/:id/close accepts custom reason text', async () => {
    prismaMock.supportTicket.update.mockResolvedValueOnce({
      id: 'ticket-1',
      userId: 'user-1',
      subject: 'Help',
      message: 'Need help',
      status: 'CLOSED',
      closedAt: new Date('2026-06-23T12:00:00.000Z'),
      closeReason: 'CUSTOM',
      closeReasonText: 'Duplicate request already handled elsewhere',
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
      user: { username: 'agent', email: 'agent@test.com' },
      messages: [],
    });

    const response = await request(createApp())
      .post('/api/admin/support/tickets/ticket-1/close')
      .send({ reason: 'CUSTOM', reasonText: 'Duplicate request already handled elsewhere' });

    expect(response.status).toBe(200);
    expect(response.body.closeReason).toBe('CUSTOM');
  });

  it('POST /news rejects invalid payload', async () => {
    const response = await request(createApp()).post('/api/admin/news').send({
      titleUk: '',
      titleEn: '',
      bodyUk: '',
      bodyEn: '',
    });

    expect(response.status).toBe(400);
  });

  it('DELETE /news/:id returns 404 for missing post', async () => {
    prismaMock.newsPost.findUnique.mockResolvedValue(null);

    const response = await request(createApp()).delete('/api/admin/news/missing');

    expect(response.status).toBe(404);
  });

  it('GET /support/tickets/:id returns 404 when missing', async () => {
    prismaMock.supportTicket.findUnique.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/admin/support/tickets/missing');

    expect(response.status).toBe(404);
  });

  it('PATCH /users/:id/block returns 404 for missing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .patch('/api/admin/users/missing/block')
      .send({ blocked: true });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  it('PATCH /users/:id/block rejects blocking admin accounts', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'admin-2',
      role: UserRole.ADMIN,
    });

    const response = await request(createApp())
      .patch('/api/admin/users/admin-2/block')
      .send({ blocked: true });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot block admin accounts');
  });

  it('PATCH /users/:id/block unblocks user', async () => {
    prismaMock.user.update.mockResolvedValueOnce({
      id: 'user-1',
      username: 'agent',
      email: 'agent@test.com',
      role: UserRole.USER,
      xp: 100,
      rank: 'Novice Hacker',
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(createApp())
      .patch('/api/admin/users/user-1/block')
      .send({ blocked: false });

    expect(response.status).toBe(200);
    expect(response.body.isBlocked).toBe(false);
  });

  it('PATCH /users/:id/block rejects invalid payload', async () => {
    const response = await request(createApp())
      .patch('/api/admin/users/user-1/block')
      .send({ blocked: 'yes' });

    expect(response.status).toBe(400);
  });

  it('POST /support/tickets/:id/reply returns 404 for missing ticket', async () => {
    prismaMock.supportTicket.findUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .post('/api/admin/support/tickets/missing/reply')
      .send({ body: 'Reply text' });

    expect(response.status).toBe(404);
  });

  it('POST /support/tickets/:id/reply rejects closed ticket', async () => {
    prismaMock.supportTicket.findUnique.mockResolvedValue({
      id: 'ticket-1',
      userId: 'user-1',
      subject: 'Help',
      status: 'CLOSED',
    });

    const response = await request(createApp())
      .post('/api/admin/support/tickets/ticket-1/reply')
      .send({ body: 'Reply text' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Ticket is closed');
  });

  it('POST /support/tickets/:id/reply rejects empty body', async () => {
    const response = await request(createApp())
      .post('/api/admin/support/tickets/ticket-1/reply')
      .send({ body: '' });

    expect(response.status).toBe(400);
  });

  it('POST /support/tickets/:id/close returns 404 for missing ticket', async () => {
    prismaMock.supportTicket.findUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .post('/api/admin/support/tickets/missing/close')
      .send({ reason: 'DECLINED' });

    expect(response.status).toBe(404);
  });

  it('POST /support/tickets/:id/close rejects already closed ticket', async () => {
    prismaMock.supportTicket.findUnique.mockResolvedValue({
      id: 'ticket-1',
      status: 'CLOSED',
    });

    const response = await request(createApp())
      .post('/api/admin/support/tickets/ticket-1/close')
      .send({ reason: 'DECLINED' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Ticket is already closed');
  });

  it('PATCH /support/messages/:messageId returns 404 for missing message', async () => {
    prismaMock.supportMessage.findUnique.mockResolvedValue(null);

    const response = await request(createApp())
      .patch('/api/admin/support/messages/missing')
      .send({ body: 'Updated reply' });

    expect(response.status).toBe(404);
  });

  it('PATCH /support/messages/:messageId rejects user message', async () => {
    prismaMock.supportMessage.findUnique.mockResolvedValue({
      id: 'msg-1',
      authorId: 'user-1',
      body: 'User message',
      isStaffReply: false,
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
      ticket: { id: 'ticket-1', status: 'OPEN', userId: 'user-1', subject: 'Help' },
      author: { username: 'agent' },
    });

    const response = await request(createApp())
      .patch('/api/admin/support/messages/msg-1')
      .send({ body: 'Updated reply' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Cannot modify user messages');
  });

  it('PATCH /support/messages/:messageId rejects closed ticket', async () => {
    prismaMock.supportMessage.findUnique.mockResolvedValue({
      id: 'msg-1',
      authorId: 'admin-1',
      body: 'Staff reply',
      isStaffReply: true,
      createdAt: new Date('2026-06-23T11:00:00.000Z'),
      ticket: { id: 'ticket-1', status: 'CLOSED', userId: 'user-1', subject: 'Help' },
      author: { username: 'admin' },
    });

    const response = await request(createApp())
      .patch('/api/admin/support/messages/msg-1')
      .send({ body: 'Updated reply' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Ticket is closed');
  });

  it('DELETE /support/messages/:messageId returns 404 for missing message', async () => {
    prismaMock.supportMessage.findUnique.mockResolvedValue(null);

    const response = await request(createApp()).delete('/api/admin/support/messages/missing');

    expect(response.status).toBe(404);
  });

  it('DELETE /support/messages/:messageId reopens ticket when last staff reply removed', async () => {
    prismaMock.supportMessage.count.mockResolvedValue(0);

    const response = await request(createApp()).delete('/api/admin/support/messages/msg-1');

    expect(response.status).toBe(204);
    expect(prismaMock.supportTicket.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ticket-1' },
        data: { status: 'OPEN' },
      })
    );
  });

  it('POST /news creates draft without notifying users', async () => {
    const response = await request(createApp()).post('/api/admin/news').send({
      titleUk: 'Чернетка UA',
      titleEn: 'Draft EN',
      bodyUk: 'Текст чернетки українською',
      bodyEn: 'Draft text in English',
      isPublished: false,
    });

    expect(response.status).toBe(201);
    expect(prismaMock.notification.createMany).not.toHaveBeenCalled();
  });

  it('PATCH /news/:id unpublishes post', async () => {
    prismaMock.newsPost.findUnique.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: true,
      publishedAt: new Date('2026-06-23T12:00:00.000Z'),
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
    });
    prismaMock.newsPost.update.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: false,
      publishedAt: null,
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
      author: { username: 'admin' },
    });

    const response = await request(createApp())
      .patch('/api/admin/news/news-1')
      .send({ isPublished: false });

    expect(response.status).toBe(200);
    expect(prismaMock.newsPost.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPublished: false, publishedAt: null }),
      })
    );
  });

  it('PATCH /news/:id rejects invalid payload', async () => {
    prismaMock.newsPost.findUnique.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: true,
      publishedAt: new Date('2026-06-23T12:00:00.000Z'),
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
    });

    const response = await request(createApp())
      .patch('/api/admin/news/news-1')
      .send({ titleUk: 'ab' });

    expect(response.status).toBe(400);
  });

  it('PATCH /news/:id returns 500 on update failure', async () => {
    prismaMock.newsPost.findUnique.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: false,
      publishedAt: null,
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
    });
    prismaMock.$transaction.mockRejectedValueOnce(new Error('db down'));

    const response = await request(createApp())
      .patch('/api/admin/news/news-1')
      .send({ titleUk: 'Updated title here' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });

  it('DELETE /news/:id returns 500 on delete failure', async () => {
    prismaMock.newsPost.findUnique.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Новина',
      titleEn: 'News',
      bodyUk: 'Текст',
      bodyEn: 'Text',
      isPublished: true,
      publishedAt: new Date('2026-06-23T12:00:00.000Z'),
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T12:00:00.000Z'),
      updatedAt: new Date('2026-06-23T12:00:00.000Z'),
    });
    prismaMock.newsPost.delete.mockRejectedValueOnce(new Error('db down'));

    const response = await request(createApp()).delete('/api/admin/news/news-1');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});
