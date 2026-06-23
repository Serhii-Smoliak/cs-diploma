import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRequest } from '../middleware/auth.js';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  newsPost: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
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

import newsRouter from './news.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/news', newsRouter);
  return app;
}

describe('news routes', () => {
  beforeEach(() => {
    authState.userId = 'user-1';
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ preferredLocale: 'uk' });
    prismaMock.newsPost.findMany.mockResolvedValue([
      {
        id: 'news-1',
        titleUk: 'Оновлення платформи',
        titleEn: 'Platform update',
        bodyUk: 'Новий контент',
        bodyEn: 'New content',
        isPublished: true,
        publishedAt: new Date('2026-06-23T10:00:00.000Z'),
        authorId: 'admin-1',
        createdAt: new Date('2026-06-23T10:00:00.000Z'),
        updatedAt: new Date('2026-06-23T10:00:00.000Z'),
        author: { username: 'admin' },
      },
    ]);
    prismaMock.newsPost.findFirst.mockResolvedValue({
      id: 'news-1',
      titleUk: 'Оновлення платформи',
      titleEn: 'Platform update',
      bodyUk: 'Новий контент',
      bodyEn: 'New content',
      isPublished: true,
      publishedAt: new Date('2026-06-23T10:00:00.000Z'),
      authorId: 'admin-1',
      createdAt: new Date('2026-06-23T10:00:00.000Z'),
      updatedAt: new Date('2026-06-23T10:00:00.000Z'),
      author: { username: 'admin' },
    });
  });

  it('GET / returns published news in user locale', async () => {
    const response = await request(createApp()).get('/api/news');

    expect(response.status).toBe(200);
    expect(response.body[0].title).toBe('Оновлення платформи');
  });

  it('GET /:id returns single published news post', async () => {
    const response = await request(createApp()).get('/api/news/news-1');

    expect(response.status).toBe(200);
    expect(response.body.body).toBe('Новий контент');
  });
});
