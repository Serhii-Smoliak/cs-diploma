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
  userMitreTechnique: {
    upsert: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('../db/database.js', () => ({ default: prismaMock }));
vi.mock('../validators/AnswerValidator.js', () => ({
  validateAnswer: vi.fn(() => true),
}));
vi.mock('../utils/levelMapper.js', () => ({
  mapPrismaLevelToLevel: vi.fn((level) => ({
    level_id: level?.levelId ?? 'ghost_recon_01',
    mission_id: level?.missionId ?? 'operation_ghost',
    mitre_id: level?.mitreId ?? 'T1598',
    title: level?.title ?? 'Find admin email',
    order: level?.orderIndex ?? 1,
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
import { getCurrentStealth, changeStealth } from './stealthService.js';

describe('levelService.submitAnswer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      xp: 100,
      preferredLocale: 'uk',
    });
    prismaMock.level.findFirst.mockResolvedValue({
      levelId: 'ghost_recon_01',
      missionId: 'operation_ghost',
      mitreId: 'T1598',
      title: 'Find admin email',
      orderIndex: 1,
    });
    prismaMock.userMitreTechnique.upsert.mockResolvedValue({});
    prismaMock.userProgress.findUnique.mockResolvedValue(null);
    prismaMock.userProgress.create.mockResolvedValue({
      userId: 'u1',
      levelId: 'ghost_recon_01',
      completed: true,
      attempts: 1,
      lastAnswer: '.*',
    });
    prismaMock.userStats.findUnique.mockResolvedValue({
      totalXp: 100,
      rank: 'Script Kiddie',
    });
    prismaMock.userStats.update.mockResolvedValue({});
    prismaMock.notification.create.mockResolvedValue({});
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        userStats: prismaMock.userStats,
        notification: prismaMock.notification,
      })
    );
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

  it('creates rank-up notification when rank increases', async () => {
    prismaMock.userStats.findUnique.mockResolvedValueOnce({
      totalXp: 450,
      rank: 'Script Kiddie',
    });

    await submitAnswer('u1', 'ghost_recon_01', '.*@.*');

    expect(prismaMock.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        type: 'SYSTEM',
        title: 'notification.rankUp.title',
        body: 'Novice Hacker',
        link: '/ranks',
      },
    });
  });

  it('does not create rank-up notification when rank stays the same', async () => {
    prismaMock.userStats.findUnique.mockResolvedValueOnce({
      totalXp: 600,
      rank: 'Novice Hacker',
    });

    await submitAnswer('u1', 'ghost_recon_01', '.*@.*');

    expect(prismaMock.notification.create).not.toHaveBeenCalled();
  });

  it('throws when level is missing', async () => {
    prismaMock.level.findFirst.mockResolvedValueOnce(null);

    await expect(submitAnswer('u1', 'missing', 'x')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('returns failure response for invalid answer and applies stealth penalty', async () => {
    vi.mocked(validateAnswer).mockReturnValueOnce(false);
    vi.mocked(getCurrentStealth).mockResolvedValueOnce(50).mockResolvedValueOnce(45);
    vi.mocked(changeStealth).mockResolvedValueOnce({ stealth: 45, change: -5 });

    const result = await submitAnswer('u1', 'ghost_recon_01', 'wrong');

    expect(result.success).toBe(false);
    expect(result.stealthChange).toBe(-5);
    expect(result.stealthDepleted).toBe(false);
  });

  it('updates existing progress on repeat attempt', async () => {
    prismaMock.userProgress.findUnique.mockResolvedValueOnce({
      id: 'progress-1',
      completed: false,
      attempts: 2,
      lastAnswer: null,
    });
    prismaMock.userProgress.update.mockResolvedValueOnce({
      id: 'progress-1',
      completed: true,
      attempts: 3,
      lastAnswer: '.*@.*',
    });

    await submitAnswer('u1', 'ghost_recon_01', '.*@.*');

    expect(prismaMock.userProgress.update).toHaveBeenCalled();
    expect(prismaMock.userProgress.create).not.toHaveBeenCalled();
  });

  it('returns already completed message without awarding xp again', async () => {
    prismaMock.userProgress.findUnique.mockResolvedValueOnce({
      id: 'progress-1',
      completed: true,
      attempts: 3,
      lastAnswer: '.*@.*',
    });
    prismaMock.userProgress.update.mockResolvedValueOnce({
      id: 'progress-1',
      completed: true,
      attempts: 4,
      lastAnswer: '.*@.*',
    });

    const result = await submitAnswer('u1', 'ghost_recon_01', '.*@.*');

    expect(result.success).toBe(true);
    expect(result.message).toContain('вже виконано');
    expect(result.xpGained).toBe(0);
    expect(prismaMock.userStats.update).not.toHaveBeenCalled();
  });

  it('records discovered MITRE technique on successful answer', async () => {
    await submitAnswer('u1', 'ghost_recon_01', '.*@.*');

    expect(prismaMock.userMitreTechnique.upsert).toHaveBeenCalledWith({
      where: { userId_mitreId: { userId: 'u1', mitreId: 'T1598' } },
      update: {},
      create: { userId: 'u1', mitreId: 'T1598' },
    });
  });

  it('returns next level id when next mission level exists', async () => {
    prismaMock.level.findFirst
      .mockResolvedValueOnce({
        levelId: 'ghost_recon_01',
        missionId: 'operation_ghost',
        mitreId: 'T1598',
        title: 'Find admin email',
        orderIndex: 1,
      })
      .mockResolvedValueOnce({
        levelId: 'ghost_recon_02',
        missionId: 'operation_ghost',
        orderIndex: 2,
      });

    const result = await submitAnswer('u1', 'ghost_recon_01', '.*@.*');

    expect(result.nextLevelId).toBe('ghost_recon_02');
  });

  it('treats validation exceptions as invalid answers', async () => {
    vi.mocked(validateAnswer).mockImplementationOnce(() => {
      throw new Error('bad validation');
    });
    vi.mocked(getCurrentStealth).mockResolvedValueOnce(50).mockResolvedValueOnce(45);
    vi.mocked(changeStealth).mockResolvedValueOnce({ stealth: 45, change: -5 });

    const result = await submitAnswer('u1', 'ghost_recon_01', 'x');

    expect(result.success).toBe(false);
  });
});
