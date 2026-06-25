import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRequest } from '../middleware/auth.js';

const prismaMock = vi.hoisted(() => ({
  language: {
    findMany: vi.fn(),
  },
  translation: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
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

import translationsRouter from './translations.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/translations', translationsRouter);
  return app;
}

describe('translations routes', () => {
  beforeEach(() => {
    authState.userId = 'admin-1';
    vi.clearAllMocks();
    prismaMock.language.findMany.mockResolvedValue([
      { code: 'en', name: 'English', isActive: true },
      { code: 'uk', name: 'Ukrainian', isActive: true },
    ]);
    prismaMock.translation.findMany.mockResolvedValue([
      { key: 'title', value: 'Leaderboard', namespace: 'ui' },
    ]);
    prismaMock.translation.upsert.mockResolvedValue({
      key: 'title',
      locale: 'uk',
      namespace: 'ui',
      value: 'Leaderboard',
    });
    prismaMock.$transaction.mockResolvedValue([
      { key: 'title', locale: 'uk', namespace: 'ui', value: 'Leaderboard' },
    ]);
  });

  it('GET /languages returns active languages', async () => {
    const response = await request(createApp()).get('/api/translations/languages');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('GET /languages returns 500 on query failure', async () => {
    prismaMock.language.findMany.mockRejectedValue(new Error('db down'));

    const response = await request(createApp()).get('/api/translations/languages');

    expect(response.status).toBe(500);
  });

  it('GET / returns translations object for locale and namespace', async () => {
    const response = await request(createApp()).get('/api/translations?locale=uk&namespace=ui');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ title: 'Leaderboard' });
  });

  it('GET / returns 400 for invalid locale', async () => {
    const response = await request(createApp()).get('/api/translations?locale=ru&namespace=ui');

    expect(response.status).toBe(400);
  });

  it('GET / returns 500 on unexpected query failure', async () => {
    prismaMock.translation.findMany.mockRejectedValue(new Error('db down'));

    const response = await request(createApp()).get('/api/translations?locale=uk&namespace=ui');

    expect(response.status).toBe(500);
  });

  it('GET /namespaces returns grouped translations', async () => {
    prismaMock.translation.findMany.mockResolvedValue([
      { key: 'title', value: 'Leaderboard', namespace: 'ui' },
      { key: 'title', value: 'FAQ', namespace: 'faq' },
    ]);

    const response = await request(createApp()).get(
      '/api/translations/namespaces?locale=uk&namespaces=ui,faq'
    );

    expect(response.status).toBe(200);
    expect(response.body.ui.title).toBe('Leaderboard');
    expect(response.body.faq.title).toBe('FAQ');
  });

  it('GET /namespaces returns 400 for invalid namespaces', async () => {
    const response = await request(createApp()).get(
      '/api/translations/namespaces?locale=uk&namespaces=../secrets'
    );

    expect(response.status).toBe(400);
  });

  it('POST / upserts a translation', async () => {
    const response = await request(createApp()).post('/api/translations').send({
      locale: 'uk',
      namespace: 'ui',
      key: 'title',
      value: 'Leaderboard',
    });

    expect(response.status).toBe(200);
    expect(response.body.key).toBe('title');
    expect(prismaMock.translation.upsert).toHaveBeenCalled();
  });

  it('POST / returns 400 for invalid payload', async () => {
    const response = await request(createApp()).post('/api/translations').send({
      locale: 'uk',
      namespace: 'ui',
      key: '../bad',
      value: 'x',
    });

    expect(response.status).toBe(400);
  });

  it('POST / returns 500 on unexpected upsert failure', async () => {
    prismaMock.translation.upsert.mockRejectedValue(new Error('db down'));

    const response = await request(createApp()).post('/api/translations').send({
      locale: 'uk',
      namespace: 'ui',
      key: 'title',
      value: 'Leaderboard',
    });

    expect(response.status).toBe(500);
  });

  it('POST /bulk upserts multiple translations', async () => {
    const response = await request(createApp())
      .post('/api/translations/bulk')
      .send({
        locale: 'uk',
        namespace: 'ui',
        translations: [{ key: 'title', value: 'Leaderboard' }],
      });

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(1);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it('POST /bulk returns 400 for invalid bulk payload', async () => {
    const response = await request(createApp()).post('/api/translations/bulk').send({
      locale: 'uk',
      namespace: 'ui',
      translations: 'not-an-array',
    });

    expect(response.status).toBe(400);
  });
});
