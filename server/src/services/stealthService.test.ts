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

import {
  changeStealth,
  applyWaitRecovery,
  getWaitRecoveryStatus,
  restoreMasking,
  syncStealth,
} from './stealthService.js';

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

  it('adds masking restore amount up to max', async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 10,
      lastStealthUpdateAt: new Date(),
      updatedAt: new Date(),
    });

    const restored = await restoreMasking('user-1');
    expect(restored).toBe(60);
  });

  it('rejects masking when it would exceed max', async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 60,
      lastStealthUpdateAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(restoreMasking('user-1')).rejects.toThrow('MASKING_WOULD_EXCEED_MAX');
  });

  it('returns alreadyAtMax when wait recovery is requested at full stealth', async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 100,
      lastStealthUpdateAt: new Date(Date.now() - 60_000),
      updatedAt: new Date(Date.now() - 60_000),
    });

    const result = await applyWaitRecovery('user-1');

    expect(result).toEqual({ stealth: 100, applied: false, alreadyAtMax: true });
    expect(prismaMock.userStats.update).not.toHaveBeenCalled();
  });

  it('returns wait recovery status when interval has not elapsed', async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 20,
      lastStealthUpdateAt: new Date(Date.now() - 60_000),
      updatedAt: new Date(Date.now() - 60_000),
    });

    const status = await getWaitRecoveryStatus('user-1');

    expect(status.ready).toBe(false);
    expect(status.stealth).toBe(20);
    expect(status.retryAfterMs).toBeGreaterThan(0);
  });

  it('returns ready wait recovery status when interval has elapsed', async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 20,
      lastStealthUpdateAt: new Date(Date.now() - 3_600_000),
      updatedAt: new Date(Date.now() - 3_600_000),
    });

    const status = await getWaitRecoveryStatus('user-1');

    expect(status).toEqual({ stealth: 20, ready: true });
  });

  it('returns retryAfterMs when wait recovery interval has not elapsed', async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 20,
      lastStealthUpdateAt: new Date(Date.now() - 60_000),
      updatedAt: new Date(Date.now() - 60_000),
    });

    const result = await applyWaitRecovery('user-1');

    expect(result.applied).toBe(false);
    expect(result.stealth).toBe(20);
    expect(result.alreadyAtMax).toBeUndefined();
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('applies wait recovery when interval has elapsed', async () => {
    prismaMock.userStats.findUnique.mockResolvedValue({
      stealth: 20,
      lastStealthUpdateAt: new Date(Date.now() - 3_600_000),
      updatedAt: new Date(Date.now() - 3_600_000),
    });

    const result = await applyWaitRecovery('user-1');

    expect(result).toEqual({ stealth: 30, applied: true });
  });
});
