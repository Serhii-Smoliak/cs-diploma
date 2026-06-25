import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  mission: {
    findMany: vi.fn(),
  },
  level: {
    findMany: vi.fn(),
  },
}));

vi.mock('../db/database.js', () => ({ default: prismaMock }));

vi.mock('../utils/levelMapper.js', () => ({
  mapPrismaLevelToLevel: vi.fn((level) => ({
    level_id: level.levelId,
    mission_id: level.missionId,
    title: level.title,
    order: level.orderIndex,
  })),
}));

import missionsRouter from './missions.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/missions', missionsRouter);
  return app;
}

describe('missions routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.mission.findMany.mockResolvedValue([
      {
        id: 'operation_ghost',
        name: 'Operation Ghost',
        description: 'Recon mission',
        difficulty: 'beginner',
        orderIndex: 1,
        mitreTechniques: ['T1598'],
        levels: [{ mitreId: 'T1593' }],
        mitreTechniquesRelation: [{ mitreId: 'T1598' }, { mitreId: 'T1593' }],
      },
    ]);
    prismaMock.level.findMany.mockResolvedValue([
      {
        levelId: 'ghost_recon_01',
        missionId: 'operation_ghost',
        title: 'Find admin email',
        orderIndex: 1,
      },
    ]);
  });

  it('GET / returns formatted missions with merged MITRE techniques', async () => {
    const response = await request(createApp()).get('/api/missions');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        id: 'operation_ghost',
        name: 'Operation Ghost',
        description: 'Recon mission',
        difficulty: 'beginner',
        mitreTechniques: expect.arrayContaining(['T1598', 'T1593']),
        order: 1,
      },
    ]);
    expect(response.body[0].mitreTechniques).toHaveLength(2);
  });

  it('GET / returns 500 when mission query fails', async () => {
    prismaMock.mission.findMany.mockRejectedValue(new Error('db down'));

    const response = await request(createApp()).get('/api/missions');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });

  it('GET /:id/levels returns mapped levels', async () => {
    const response = await request(createApp()).get('/api/missions/operation_ghost/levels');

    expect(response.status).toBe(200);
    expect(response.body[0].level_id).toBe('ghost_recon_01');
  });

  it('GET /:id/levels returns 404 when mission has no levels', async () => {
    prismaMock.level.findMany.mockResolvedValue([]);

    const response = await request(createApp()).get('/api/missions/missing/levels');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Mission not found');
  });

  it('GET /:id/levels returns 500 when level query fails', async () => {
    prismaMock.level.findMany.mockRejectedValue(new Error('db down'));

    const response = await request(createApp()).get('/api/missions/operation_ghost/levels');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Internal server error');
  });
});
