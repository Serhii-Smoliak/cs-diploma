import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../errors/httpError.js';
import type { AuthRequest } from '../middleware/auth.js';

const submitAnswer = vi.hoisted(() => vi.fn());
const authState = vi.hoisted(() => ({ userId: 'user-1' as string | undefined }));

vi.mock('../middleware/auth.js', () => ({
  authenticate: (req: AuthRequest, _res: unknown, next: () => void) => {
    req.userId = authState.userId;
    req.userEmail = 'agent@test.com';
    next();
  },
}));

vi.mock('../services/levelService.js', () => ({
  submitAnswer,
}));

import levelsRouter from './levels.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/levels', levelsRouter);
  return app;
}

describe('levels routes', () => {
  beforeEach(() => {
    authState.userId = 'user-1';
    submitAnswer.mockReset();
  });

  it('POST /:id/submit returns result', async () => {
    submitAnswer.mockResolvedValue({ success: true, message: 'OK', xpGained: 10 });

    const response = await request(createApp())
      .post('/api/levels/ghost_recon_01/submit')
      .send({ answer: '.*@.*' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(submitAnswer).toHaveBeenCalledWith('user-1', 'ghost_recon_01', '.*@.*');
  });

  it('POST /:id/submit validates body', async () => {
    const response = await request(createApp())
      .post('/api/levels/ghost_recon_01/submit')
      .send({ answer: true });

    expect(response.status).toBe(400);
    expect(submitAnswer).not.toHaveBeenCalled();
  });

  it('POST /:id/submit maps HttpError', async () => {
    submitAnswer.mockRejectedValue(new HttpError(404, 'Level not found'));

    const response = await request(createApp())
      .post('/api/levels/missing/submit')
      .send({ answer: 'x' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Level not found');
  });

  it('POST /:id/submit returns 500 on unexpected error', async () => {
    submitAnswer.mockRejectedValue(new Error('db down'));

    const response = await request(createApp())
      .post('/api/levels/ghost_recon_01/submit')
      .send({ answer: 'x' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });

  it('POST /:id/submit returns 401 without user id', async () => {
    authState.userId = undefined;

    const response = await request(createApp())
      .post('/api/levels/ghost_recon_01/submit')
      .send({ answer: 'x' });

    expect(response.status).toBe(401);
    expect(submitAnswer).not.toHaveBeenCalled();
  });
});
