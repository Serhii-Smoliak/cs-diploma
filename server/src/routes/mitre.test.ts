import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthRequest } from '../middleware/auth.js';

const prismaMock = vi.hoisted(() => ({
  mitreTechnique: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
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

import mitreRouter from './mitre.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/mitre', mitreRouter);
  return app;
}

describe('mitre routes', () => {
  beforeEach(() => {
    authState.userId = 'admin-1';
    vi.clearAllMocks();
    prismaMock.mitreTechnique.findMany.mockResolvedValue([
      { id: 'T1598', name: 'Phishing for Information', tactic: 'Reconnaissance' },
    ]);
    prismaMock.mitreTechnique.findUnique.mockResolvedValue({
      id: 'T1598',
      name: 'Phishing for Information',
      tactic: 'Reconnaissance',
      missions: [{ mission: { id: 'operation_ghost', name: 'Operation Ghost' } }],
      levels: [{ mission: { id: 'operation_ghost', name: 'Operation Ghost' } }],
    });
    syncMock.syncMitreTechniques.mockResolvedValue({ synced: 2, errors: 0 });
  });

  it('GET /techniques returns technique list', async () => {
    const response = await request(createApp()).get('/api/mitre/techniques');

    expect(response.status).toBe(200);
    expect(response.body[0].id).toBe('T1598');
  });

  it('GET /techniques returns 500 on query failure', async () => {
    prismaMock.mitreTechnique.findMany.mockRejectedValue(new Error('db down'));

    const response = await request(createApp()).get('/api/mitre/techniques');

    expect(response.status).toBe(500);
  });

  it('GET /techniques/:id returns technique with related missions', async () => {
    const response = await request(createApp()).get('/api/mitre/techniques/T1598');

    expect(response.status).toBe(200);
    expect(response.body.relatedMissions).toEqual([
      { id: 'operation_ghost', name: 'Operation Ghost' },
    ]);
  });

  it('GET /techniques/:id returns 404 when technique is missing', async () => {
    prismaMock.mitreTechnique.findUnique.mockResolvedValue(null);

    const response = await request(createApp()).get('/api/mitre/techniques/missing');

    expect(response.status).toBe(404);
  });

  it('GET /techniques/:id returns 500 on query failure', async () => {
    prismaMock.mitreTechnique.findUnique.mockRejectedValue(new Error('db down'));

    const response = await request(createApp()).get('/api/mitre/techniques/T1598');

    expect(response.status).toBe(500);
  });

  it('POST /sync runs MITRE synchronization', async () => {
    const response = await request(createApp()).post('/api/mitre/sync');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.synced).toBe(2);
    expect(syncMock.syncMitreTechniques).toHaveBeenCalled();
  });

  it('POST /sync returns 500 when sync fails', async () => {
    syncMock.syncMitreTechniques.mockRejectedValue(new Error('sync down'));

    const response = await request(createApp()).post('/api/mitre/sync');

    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
  });
});
