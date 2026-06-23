import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRequest } from '../middleware/auth.js';

const prismaMock = vi.hoisted(() => ({
  supportTicket: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  supportMessage: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

const authState = vi.hoisted(() => ({ userId: 'user-1' as string | undefined }));

vi.mock('../db/database.js', () => ({ default: prismaMock }));

vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: AuthRequest, _res: unknown, next: () => void) => {
    req.userId = authState.userId;
    next();
  },
}));

import supportRouter from './support.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/support', supportRouter);
  return app;
}

describe('support routes', () => {
  beforeEach(() => {
    authState.userId = 'user-1';
    vi.clearAllMocks();
    prismaMock.supportTicket.count.mockResolvedValue(0);
    prismaMock.supportTicket.findMany.mockResolvedValue([]);
    prismaMock.supportTicket.findFirst.mockResolvedValue(null);
    prismaMock.supportTicket.create.mockResolvedValue({
      id: 'ticket-1',
      subject: 'Help',
      message: 'Need assistance with login',
      status: 'OPEN',
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
      updatedAt: new Date('2026-06-23T10:00:00.000Z'),
    });
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        supportTicket: prismaMock.supportTicket,
        supportMessage: prismaMock.supportMessage,
      })
    );
    prismaMock.supportMessage.create.mockResolvedValue({});
  });

  it('GET /tickets/limit returns remaining daily quota', async () => {
    prismaMock.supportTicket.count.mockResolvedValue(2);

    const response = await request(createApp()).get('/api/support/tickets/limit');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ limit: 3, usedToday: 2, remainingToday: 1 });
  });

  it('POST /tickets creates ticket when under daily limit', async () => {
    const response = await request(createApp()).post('/api/support/tickets').send({
      subject: 'Help',
      message: 'Need assistance with login',
    });

    expect(response.status).toBe(201);
    expect(response.body.subject).toBe('Help');
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('POST /tickets rejects when daily limit reached', async () => {
    prismaMock.supportTicket.count.mockResolvedValue(3);

    const response = await request(createApp()).post('/api/support/tickets').send({
      subject: 'Help',
      message: 'Need assistance with login',
    });

    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Daily support ticket limit reached');
  });

  it('POST /tickets rejects invalid payload', async () => {
    const response = await request(createApp()).post('/api/support/tickets').send({
      subject: 'Hi',
      message: 'short',
    });

    expect(response.status).toBe(400);
  });

  it('GET /tickets returns user tickets', async () => {
    prismaMock.supportTicket.findMany.mockResolvedValue([
      {
        id: 'ticket-1',
        subject: 'Help',
        message: 'Need assistance with login today',
        status: 'OPEN',
        closedAt: null,
        closeReason: null,
        closeReasonText: null,
        createdAt: new Date('2026-06-23T10:00:00.000Z'),
        updatedAt: new Date('2026-06-23T10:00:00.000Z'),
      },
    ]);

    const response = await request(createApp()).get('/api/support/tickets');

    expect(response.status).toBe(200);
    expect(response.body[0].subject).toBe('Help');
    expect(response.body[0].messagePreview).toBeDefined();
  });

  it('GET /tickets/:id returns ticket with messages', async () => {
    prismaMock.supportTicket.findFirst.mockResolvedValue({
      id: 'ticket-1',
      subject: 'Help',
      message: 'Need assistance with login today',
      status: 'OPEN',
      closedAt: null,
      closeReason: null,
      closeReasonText: null,
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
      updatedAt: new Date('2026-06-23T10:00:00.000Z'),
      messages: [
        {
          id: 'msg-1',
          authorId: 'user-1',
          body: 'Need assistance with login today',
          isStaffReply: false,
          createdAt: new Date('2026-06-23T10:00:00.000Z'),
          author: { username: 'agent' },
        },
      ],
    });

    const response = await request(createApp()).get('/api/support/tickets/ticket-1');

    expect(response.status).toBe(200);
    expect(response.body.messages).toHaveLength(1);
  });

  it('GET /tickets/:id returns 404 when ticket missing', async () => {
    const response = await request(createApp()).get('/api/support/tickets/missing');

    expect(response.status).toBe(404);
  });
});
