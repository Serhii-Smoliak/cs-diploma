import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  user: { findUnique: vi.fn() },
  level: { findFirst: vi.fn() },
  userProgress: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  userStats: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
}));

vi.mock('../db/database.js', () => ({ default: prismaMock }));
vi.mock('../validators/AnswerValidator.js', () => ({
  validateAnswer: vi.fn(() => true),
}));
vi.mock('../utils/levelMapper.js', () => ({
  mapPrismaLevelToLevel: vi.fn(() => ({
    level_id: 'ghost_recon_01',
    title: 'Find admin email',
    task_type: 'code_editor',
    validation: { type: 'regex_match', correct_pattern: '.*' },
    rewards: { xp: 100, stealth_impact: -5 },
  })),
}));
vi.mock('./stealthService.js', () => ({
  getCurrentStealth: vi.fn().mockResolvedValue(50),
  changeStealth: vi.fn().mockResolvedValue({ stealth: 45, change: -5 }),
}));
vi.mock('../config/stealthConfig.js', () => ({
  getStealthConfig: () => ({ failPenalty: 5, max: 100 }),
}));

import { submitAnswer } from './levelService.js';
import { validateAnswer } from '../validators/AnswerValidator.js';
import { getCurrentStealth } from './stealthService.js';

describe('levelService.submitAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'u1', xp: 100 });
    prismaMock.level.findFirst.mockResolvedValue({ levelId: 'ghost_recon_01' });
    prismaMock.userProgress.findUnique.mockResolvedValue(null);
    prismaMock.userProgress.create.mockResolvedValue({
      userId: 'u1',
      levelId: 'ghost_recon_01',
      completed: true,
      attempts: 1,
      lastAnswer: '.*',
    });
    prismaMock.userStats.findUnique.mockResolvedValue({ xp: 100, mitreTechniques: [] });
    prismaMock.userStats.update.mockResolvedValue({});
  });

  it('returns stealth depleted response without saving progress', async () => {
    vi.mocked(getCurrentStealth).mockResolvedValueOnce(0);

    const result = await submitAnswer('u1', 'ghost_recon_01', '.*');

    expect(result.stealthDepleted).toBe(true);
    expect(prismaMock.userProgress.create).not.toHaveBeenCalled();
  });

  it('creates progress for valid first attempt', async () => {
    const result = await submitAnswer('u1', 'ghost_recon_01', '.*@.*');

    expect(validateAnswer).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(prismaMock.userProgress.create).toHaveBeenCalled();
  });

  it('throws when user is missing', async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);
    await expect(submitAnswer('missing', 'ghost_recon_01', 'x')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
