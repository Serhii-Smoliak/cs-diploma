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
});
