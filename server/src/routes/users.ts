import { Router } from 'express';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { resolveOwnerUserId } from '../middleware/ownership.js';
import prisma from '../db/database.js';
import {
  applyPassiveRegen,
  getWaitRecoveryStatus,
  restoreMasking,
} from '../services/stealthService.js';
import { saveAvatarFromDataUrl } from '../services/avatarService.js';
import { formatAuthUser } from '../utils/formatUser.js';

const router = Router();

const avatarSchema = z.object({
  image: z.string().min(1),
});

const localeSchema = z.object({
  locale: z.enum(['uk', 'en']),
});

router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }

    if (user.isBlocked) {
      return res.status(403).json({ error: 'Account blocked' });
    }

    const stealth = await applyPassiveRegen(userId);

    res.json(
      formatAuthUser(user, {
        xp: user.stats?.totalXp ?? user.xp,
        rank: user.stats?.rank ?? user.rank,
        stealth,
      })
    );
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me/locale', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { locale } = localeSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferredLocale: locale },
      include: { stats: true },
    });

    const stealth = await applyPassiveRegen(userId);

    res.json(
      formatAuthUser(user, {
        xp: user.stats?.totalXp ?? user.xp,
        rank: user.stats?.rank ?? user.rank,
        stealth,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Locale update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/me/avatar', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { image } = avatarSchema.parse(req.body);
    const avatarUrl = await saveAvatarFromDataUrl(userId, image);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      include: { stats: true },
    });

    const stealth = await applyPassiveRegen(userId);

    res.json(
      formatAuthUser(user, {
        xp: user.stats?.totalXp ?? user.xp,
        rank: user.stats?.rank ?? user.rank,
        stealth,
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof Error && error.message === 'Invalid image data') {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && error.message === 'Image too large') {
      return res.status(413).json({ error: error.message });
    }
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/me/stealth/masking', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const stealth = await restoreMasking(userId);
    res.json({ stealth, message: 'Masking purchased (mock).' });
  } catch (error) {
    if (error instanceof Error && error.message === 'MASKING_WOULD_EXCEED_MAX') {
      return res.status(400).json({ error: 'Masking would exceed maximum stealth.' });
    }
    console.error('Stealth masking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me/stealth/recovery-status', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const status = await getWaitRecoveryStatus(userId);

    res.json({
      stealth: status.stealth,
      ready: status.ready,
      alreadyAtMax: status.alreadyAtMax ?? false,
      retryAfterMs: status.retryAfterMs ?? 0,
      regenAmount: status.regenAmount,
    });
  } catch (error) {
    console.error('Stealth recovery status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function loadUserProgress(userId: string) {
  return prisma.userProgress.findMany({
    where: { userId },
    select: {
      levelId: true,
      completed: true,
      attempts: true,
      lastAttempt: true,
      lastAnswer: true,
      bestScore: true,
    },
  });
}

async function loadUserStats(userId: string) {
  const stealth = await applyPassiveRegen(userId);

  const stats = await prisma.userStats.findUnique({
    where: { userId },
    include: {
      user: {
        include: {
          mitreTechniques: {
            select: {
              mitreId: true,
            },
          },
        },
      },
    },
  });

  if (!stats) {
    return null;
  }

  return {
    userId: stats.userId,
    totalXp: stats.totalXp,
    rank: stats.rank,
    stealth,
    completedLevels: stats.completedLevels,
    mitreTechniques: stats.user.mitreTechniques.map((t) => t.mitreId),
  };
}

router.get('/leaderboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    const includeAdmins = requester.role === UserRole.ADMIN;

    const users = await prisma.user.findMany({
      where: includeAdmins ? undefined : { role: UserRole.USER },
      include: {
        stats: true,
        _count: {
          select: { mitreTechniques: true },
        },
      },
    });

    const entries = users
      .map((user) => ({
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        xp: user.stats?.totalXp ?? user.xp,
        rank: user.stats?.rank ?? user.rank,
        completedLevels: user.stats?.completedLevels ?? 0,
        mitreTechniquesCount: user._count.mitreTechniques,
        isCurrentUser: user.id === userId,
      }))
      .sort((a, b) => b.xp - a.xp || a.username.localeCompare(b.username))
      .map((entry, index) => ({
        position: index + 1,
        ...entry,
      }));

    res.json(entries);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = resolveOwnerUserId(req, res);
    if (!userId) {
      return;
    }

    res.json(await loadUserProgress(userId));
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = resolveOwnerUserId(req, res);
    if (!userId) {
      return;
    }

    const stats = await loadUserStats(userId);
    if (!stats) {
      return res.status(404).json({ error: 'User stats not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** @deprecated Prefer GET /users/me/progress — param must match JWT subject. */
router.get('/:id/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const paramId = req.params.id;
    const userId = resolveOwnerUserId(req, res, Array.isArray(paramId) ? paramId[0] : paramId);
    if (!userId) {
      return;
    }

    res.json(await loadUserProgress(userId));
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** @deprecated Prefer GET /users/me/stats — param must match JWT subject. */
router.get('/:id/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const paramId = req.params.id;
    const userId = resolveOwnerUserId(req, res, Array.isArray(paramId) ? paramId[0] : paramId);
    if (!userId) {
      return;
    }

    const stats = await loadUserStats(userId);
    if (!stats) {
      return res.status(404).json({ error: 'User stats not found' });
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
