import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import prisma from '../db/database.js';

const router = Router();

// Get user progress
router.get('/:id/progress', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const progress = await prisma.userProgress.findMany({
      where: { userId: id },
      select: {
        levelId: true,
        completed: true,
        attempts: true,
        lastAttempt: true,
        lastAnswer: true,
        bestScore: true,
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user stats
router.get('/:id/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const stats = await prisma.userStats.findUnique({
      where: { userId: id },
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
      return res.status(404).json({ error: 'User stats not found' });
    }

    res.json({
      userId: stats.userId,
      totalXp: stats.totalXp,
      rank: stats.rank,
      stealth: stats.stealth,
      completedLevels: stats.completedLevels,
      mitreTechniques: stats.user.mitreTechniques.map(t => t.mitreId),
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

