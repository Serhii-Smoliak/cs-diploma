import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import type { AuthRequest } from '../middleware/auth.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
  },
  userProgress: {
    findMany: vi.fn(),
  },
  userStats: {
    findUnique: vi.fn(),
  },
}));

const stealthMocks = vi.hoisted(() => ({
  applyPassiveRegen: vi.fn(),
  restoreMasking: vi.fn(),
  applyWaitRecovery: vi.fn(),
}));

const authState = vi.hoisted(() => ({ userId: 'user-1' as string | undefined }));

vi.mock('../db/database.js', () => ({ default: prismaMock }));

vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: AuthRequest, _res: unknown, next: () => void) => {
    req.userId = authState.userId;
    req.userEmail = 'agent@test.com';
    next();
  },
}));

vi.mock('../services/stealthService.js', () => stealthMocks);

vi.mock('../services/avatarService.js', () => ({
  saveAvatarFromDataUrl: vi.fn().mockResolvedValue('/uploads/avatars/user-1.png'),
}));

import usersRouter from './users.js';
import { saveAvatarFromDataUrl } from '../services/avatarService.js';

const mockUser = {
  id: 'user-1',
  username: 'agent',
  email: 'agent@test.com',
  xp: 100,
  rank: 'Novice Hacker',
  stealth: 80,
  preferredLocale: 'en',
  avatarUrl: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  role: UserRole.USER,
  isBlocked: false,
  stats: { totalXp: 100, rank: 'Novice Hacker', stealth: 80, completedLevels: 1 },
};

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/users', usersRouter);
  return app;
}

describe('users routes', () => {
  beforeEach(() => {
    authState.userId = 'user-1';
    vi.clearAllMocks();
    stealthMocks.applyPassiveRegen.mockResolvedValue(80);
    stealthMocks.restoreMasking.mockResolvedValue(50);
    stealthMocks.applyWaitRecovery.mockResolvedValue({
      applied: true,
      stealth: 25,
      retryAfterMs: 0,
    });
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue(mockUser);
    prismaMock.userProgress.findMany.mockResolvedValue([
      { levelId: 'ghost_recon_01', completed: true, attempts: 1, lastAnswer: 'x' },
    ]);
    prismaMock.userStats.findUnique.mockResolvedValue({
      userId: 'user-1',
      totalXp: 100,
      rank: 'Novice Hacker',
      stealth: 80,
      completedLevels: 1,
      user: { mitreTechniques: [{ mitreId: 'T1593' }] },
    });
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        username: 'agent',
        avatarUrl: null,
        xp: 100,
        rank: 'Novice Hacker',
        role: UserRole.USER,
        stats: { totalXp: 100, rank: 'Novice Hacker', completedLevels: 1 },
        _count: { mitreTechniques: 1 },
      },
    ]);
  });

  it('GET /me returns formatted user', async () => {
    const response = await request(createApp()).get('/api/users/me');

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('agent@test.com');
    expect(response.body.stealth).toBe(80);
  });

  it('GET /me returns 401 when user missing', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const response = await request(createApp()).get('/api/users/me');

    expect(response.status).toBe(401);
  });

  it('GET /me returns 403 when user is blocked', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ ...mockUser, isBlocked: true });

    const response = await request(createApp()).get('/api/users/me');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Account blocked');
  });

  it('PUT /me/locale updates locale', async () => {
    const response = await request(createApp()).put('/api/users/me/locale').send({ locale: 'uk' });

    expect(response.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('PUT /me/locale rejects invalid locale', async () => {
    const response = await request(createApp()).put('/api/users/me/locale').send({ locale: 'de' });

    expect(response.status).toBe(400);
  });

  it('PUT /me/avatar saves avatar', async () => {
    const response = await request(createApp())
      .put('/api/users/me/avatar')
      .send({ image: 'data:image/png;base64,abc' });

    expect(response.status).toBe(200);
    expect(saveAvatarFromDataUrl).toHaveBeenCalledWith('user-1', 'data:image/png;base64,abc');
  });

  it('PUT /me/avatar rejects invalid image', async () => {
    vi.mocked(saveAvatarFromDataUrl).mockRejectedValueOnce(new Error('Invalid image data'));

    const response = await request(createApp()).put('/api/users/me/avatar').send({ image: 'bad' });

    expect(response.status).toBe(400);
  });

  it('POST /me/stealth/masking restores stealth', async () => {
    const response = await request(createApp()).post('/api/users/me/stealth/masking');

    expect(response.status).toBe(200);
    expect(response.body.stealth).toBe(50);
  });

  it('POST /me/stealth/wait applies recovery', async () => {
    const response = await request(createApp()).post('/api/users/me/stealth/wait');

    expect(response.status).toBe(200);
    expect(response.body.stealth).toBe(25);
  });

  it('POST /me/stealth/wait returns 429 when not ready', async () => {
    stealthMocks.applyWaitRecovery.mockResolvedValueOnce({
      applied: false,
      stealth: 0,
      retryAfterMs: 60000,
    });

    const response = await request(createApp()).post('/api/users/me/stealth/wait');

    expect(response.status).toBe(429);
    expect(response.body.retryAfterMs).toBe(60000);
  });

  it('GET /leaderboard returns sorted entries', async () => {
    const response = await request(createApp()).get('/api/users/leaderboard');

    expect(response.status).toBe(200);
    expect(response.body[0].username).toBe('agent');
    expect(response.body[0].position).toBe(1);
  });

  it('GET /me/progress returns progress list', async () => {
    const response = await request(createApp()).get('/api/users/me/progress');

    expect(response.status).toBe(200);
    expect(response.body[0].levelId).toBe('ghost_recon_01');
  });

  it('GET /me/stats returns stats payload', async () => {
    const response = await request(createApp()).get('/api/users/me/stats');

    expect(response.status).toBe(200);
    expect(response.body.mitreTechniques).toEqual(['T1593']);
  });

  it('GET /me/stats returns 404 when stats missing', async () => {
    prismaMock.userStats.findUnique.mockResolvedValueOnce(null);

    const response = await request(createApp()).get('/api/users/me/stats');

    expect(response.status).toBe(404);
  });

  it('GET /:id/progress returns progress for owner', async () => {
    const response = await request(createApp()).get('/api/users/user-1/progress');

    expect(response.status).toBe(200);
    expect(response.body[0].levelId).toBe('ghost_recon_01');
  });

  it('GET /:id/stats returns stats for owner', async () => {
    const response = await request(createApp()).get('/api/users/user-1/stats');

    expect(response.status).toBe(200);
    expect(response.body.totalXp).toBe(100);
  });

  it('GET /:id/stats returns 404 when stats missing', async () => {
    prismaMock.userStats.findUnique.mockResolvedValueOnce(null);

    const response = await request(createApp()).get('/api/users/user-1/stats');

    expect(response.status).toBe(404);
  });

  it('GET /:id/stats returns 500 on unexpected error', async () => {
    prismaMock.userStats.findUnique.mockRejectedValueOnce(new Error('db'));

    const response = await request(createApp()).get('/api/users/user-1/stats');

    expect(response.status).toBe(500);
  });

  it('GET /:id/progress returns 500 on unexpected error', async () => {
    prismaMock.userProgress.findMany.mockRejectedValueOnce(new Error('db'));

    const response = await request(createApp()).get('/api/users/user-1/progress');

    expect(response.status).toBe(500);
  });

  it('GET /me returns 500 on unexpected error', async () => {
    prismaMock.user.findUnique.mockRejectedValueOnce(new Error('db'));

    const response = await request(createApp()).get('/api/users/me');

    expect(response.status).toBe(500);
  });

  it('PUT /me/avatar rejects oversized image', async () => {
    vi.mocked(saveAvatarFromDataUrl).mockRejectedValueOnce(new Error('Image too large'));

    const response = await request(createApp())
      .put('/api/users/me/avatar')
      .send({ image: 'data:image/png;base64,abc' });

    expect(response.status).toBe(413);
  });

  it('GET /leaderboard returns 404 when requester missing', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const response = await request(createApp()).get('/api/users/leaderboard');

    expect(response.status).toBe(404);
  });

  it('GET /:id/stats returns 403 for another user', async () => {
    const response = await request(createApp()).get('/api/users/other-user/stats');

    expect(response.status).toBe(403);
  });

  it('GET /:id/progress returns 403 for another user', async () => {
    const response = await request(createApp()).get('/api/users/other-user/progress');

    expect(response.status).toBe(403);
  });

  it('GET /:id/stats returns 400 for invalid user id', async () => {
    const response = await request(createApp()).get(`/api/users/${'x'.repeat(129)}/stats`);

    expect(response.status).toBe(400);
  });

  it('GET /me/stats returns 500 on unexpected error', async () => {
    prismaMock.userStats.findUnique.mockRejectedValueOnce(new Error('db'));

    const response = await request(createApp()).get('/api/users/me/stats');

    expect(response.status).toBe(500);
  });

  it('GET /me/progress returns 500 on unexpected error', async () => {
    prismaMock.userProgress.findMany.mockRejectedValueOnce(new Error('db'));

    const response = await request(createApp()).get('/api/users/me/progress');

    expect(response.status).toBe(500);
  });

  it('GET /me/progress returns 401 without user id', async () => {
    authState.userId = undefined;

    const response = await request(createApp()).get('/api/users/me/progress');

    expect(response.status).toBe(401);
  });

  it('GET /me/stats returns 401 without user id', async () => {
    authState.userId = undefined;

    const response = await request(createApp()).get('/api/users/me/stats');

    expect(response.status).toBe(401);
  });

  it('GET /leaderboard returns 500 on unexpected error', async () => {
    prismaMock.user.findMany.mockRejectedValueOnce(new Error('db'));

    const response = await request(createApp()).get('/api/users/leaderboard');

    expect(response.status).toBe(500);
  });

  it('GET /:id/progress returns 403 for another user', async () => {
    const response = await request(createApp()).get('/api/users/other-user/progress');

    expect(response.status).toBe(403);
  });
});
