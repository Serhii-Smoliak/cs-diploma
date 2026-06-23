import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
  },
}));

const stealthMock = vi.hoisted(() => ({
  applyPassiveRegen: vi.fn(),
}));

vi.mock('../db/database.js', () => ({ default: prismaMock }));

vi.mock('../middleware/authRateLimit.js', () => ({
  authLoginLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
  authRegisterLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../services/stealthService.js', () => stealthMock);

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn(),
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('jwt-token'),
  },
}));

import bcrypt from 'bcryptjs';
import authRouter from './auth.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter);
  return app;
}

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findFirst.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 'user-1',
      username: 'agent',
      email: 'agent@test.com',
      xp: 0,
      rank: 'Script Kiddie',
      stealth: 100,
      avatarUrl: null,
      preferredLocale: 'uk',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'USER',
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'agent',
      email: 'agent@test.com',
      passwordHash: 'hashed-password',
      xp: 0,
      rank: 'Script Kiddie',
      stealth: 100,
      avatarUrl: null,
      preferredLocale: 'uk',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'USER',
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      stats: { totalXp: 100, rank: 'Novice Hacker', stealth: 80 },
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    stealthMock.applyPassiveRegen.mockResolvedValue(90);
  });

  it('POST /register creates user and returns token', async () => {
    const response = await request(createApp()).post('/api/auth/register').send({
      username: 'agent',
      email: 'agent@test.com',
      password: 'secret12',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toBe('jwt-token');
    expect(response.body.user.email).toBe('agent@test.com');
  });

  it('POST /register rejects duplicate credentials', async () => {
    prismaMock.user.findFirst.mockResolvedValue({ id: 'existing' });

    const response = await request(createApp()).post('/api/auth/register').send({
      username: 'agent',
      email: 'agent@test.com',
      password: 'secret12',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Unable to register with these credentials');
  });

  it('POST /register validates payload', async () => {
    const response = await request(createApp()).post('/api/auth/register').send({
      username: 'a',
      email: 'bad',
      password: '123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid request');
  });

  it('POST /login returns token for valid credentials', async () => {
    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'agent@test.com',
      password: 'secret12',
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toBe('jwt-token');
    expect(response.body.user.stealth).toBe(90);
  });

  it('POST /login rejects unknown user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'missing@test.com',
      password: 'secret12',
    });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  it('POST /login rejects invalid password', async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'agent@test.com',
      password: 'wrong',
    });

    expect(response.status).toBe(401);
  });

  it('POST /login rejects blocked user', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'agent',
      email: 'agent@test.com',
      passwordHash: 'hashed-password',
      xp: 0,
      rank: 'Script Kiddie',
      stealth: 100,
      avatarUrl: null,
      preferredLocale: 'uk',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'USER',
      isBlocked: true,
      blockedAt: new Date('2026-06-23T00:00:00.000Z'),
      blockedReason: 'abuse',
      stats: { totalXp: 100, rank: 'Novice Hacker', stealth: 80 },
    });

    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'agent@test.com',
      password: 'secret12',
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Account blocked');
  });

  it('POST /login validates payload', async () => {
    const response = await request(createApp()).post('/api/auth/login').send({
      email: 'bad-email',
      password: '',
    });

    expect(response.status).toBe(400);
  });
});
