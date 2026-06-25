import prisma from '../db/database.js';
import { getStealthConfig } from '../config/stealthConfig.js';

export async function syncStealth(
  userId: string,
  stealth: number,
  at: Date = new Date()
): Promise<number> {
  const config = getStealthConfig();
  const clamped = Math.max(0, Math.min(config.max, stealth));

  await prisma.$transaction([
    prisma.userStats.update({
      where: { userId },
      data: {
        stealth: clamped,
        lastStealthUpdateAt: at,
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { stealth: clamped },
    }),
  ]);

  return clamped;
}

export async function applyPassiveRegen(userId: string): Promise<number> {
  const config = getStealthConfig();
  const stats = await prisma.userStats.findUnique({ where: { userId } });

  if (!stats) {
    return config.max;
  }

  if (stats.stealth >= config.max) {
    return stats.stealth;
  }

  const now = new Date();
  const lastUpdate = stats.lastStealthUpdateAt ?? stats.updatedAt;
  const secondsElapsed = (now.getTime() - lastUpdate.getTime()) / 1000;

  if (secondsElapsed < config.regenIntervalSeconds) {
    return stats.stealth;
  }

  const ticks = Math.floor(secondsElapsed / config.regenIntervalSeconds);
  const regen = ticks * config.regenAmount;
  if (regen <= 0) {
    return stats.stealth;
  }

  return syncStealth(userId, stats.stealth + regen, now);
}

export async function changeStealth(
  userId: string,
  delta: number
): Promise<{ stealth: number; change: number }> {
  await applyPassiveRegen(userId);

  const stats = await prisma.userStats.findUnique({ where: { userId } });
  const config = getStealthConfig();
  const current = stats?.stealth ?? config.max;
  const next = await syncStealth(userId, current + delta);

  return { stealth: next, change: next - current };
}

export async function restoreMasking(userId: string): Promise<number> {
  await applyPassiveRegen(userId);

  const stats = await prisma.userStats.findUnique({ where: { userId } });
  const config = getStealthConfig();
  const current = stats?.stealth ?? 0;
  const next = current + config.maskingRestore;

  if (next > config.max) {
    throw new Error('MASKING_WOULD_EXCEED_MAX');
  }

  return syncStealth(userId, next);
}

export async function getWaitRecoveryStatus(userId: string): Promise<{
  stealth: number;
  ready: boolean;
  regenAmount: number;
  alreadyAtMax?: boolean;
  retryAfterMs?: number;
}> {
  const config = getStealthConfig();
  const stats = await prisma.userStats.findUnique({ where: { userId } });

  if (!stats) {
    return {
      stealth: config.max,
      ready: false,
      alreadyAtMax: true,
      regenAmount: config.regenAmount,
    };
  }

  const currentAfterPassive = await applyPassiveRegen(userId);
  const refreshed = await prisma.userStats.findUnique({ where: { userId } });
  if (!refreshed) {
    return { stealth: currentAfterPassive, ready: false, regenAmount: config.regenAmount };
  }

  if (refreshed.stealth >= config.max) {
    return {
      stealth: refreshed.stealth,
      ready: false,
      alreadyAtMax: true,
      regenAmount: config.regenAmount,
    };
  }

  const lastUpdate = refreshed.lastStealthUpdateAt ?? refreshed.updatedAt;
  const now = new Date();
  const msElapsed = now.getTime() - lastUpdate.getTime();

  if (msElapsed < config.regenIntervalMs) {
    return {
      stealth: refreshed.stealth,
      ready: false,
      retryAfterMs: config.regenIntervalMs - msElapsed,
      regenAmount: config.regenAmount,
    };
  }

  return { stealth: refreshed.stealth, ready: true, regenAmount: config.regenAmount };
}

export async function getCurrentStealth(userId: string): Promise<number> {
  return applyPassiveRegen(userId);
}
