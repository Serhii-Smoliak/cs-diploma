import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  userStats: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  user: {
    update: vi.fn(),
  },
  $transaction: vi.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
}));

vi.mock('../db/database.js', () => ({
  default: prismaMock,
}));

vi.mock('../config/stealthConfig.js', () => ({
  getStealthConfig: () => ({
    regenIntervalSeconds: 3600,
    regenIntervalMs: 3_600_000,
    regenAmount: 10,
    max: 100,
    maskingRestore: 50,
    failPenalty: 5,
  }),
}));

import { changeStealth, restoreMasking, syncStealth } from './stealthService.js';

describe('stealthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 40,
      lastStealthUpdateAt: new Date(Date.now() - 3_600_000),
      updatedAt: new Date(Date.now() - 3_600_000),
    });
    prismaMock.userStats.update.mockResolvedValue({});
    prismaMock.user.update.mockResolvedValue({});
  });

  it('clamps stealth to configured max/min on sync', async () => {
    const result = await syncStealth('user-1', 150);
    expect(result).toBe(100);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('applies stealth delta after passive regen', async () => {
    const result = await changeStealth('user-1', -5);
    expect(result.stealth).toBe(35);
    expect(result.change).toBe(-5);
  });

  it('restores masking to configured floor', async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 10,
      lastStealthUpdateAt: new Date(),
      updatedAt: new Date(),
    });

    const restored = await restoreMasking('user-1');
    expect(restored).toBe(50);
  });
});
