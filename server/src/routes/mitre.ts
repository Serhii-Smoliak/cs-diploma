import { Router } from 'express';
import prisma from '../db/database.js';
import { syncMitreTechniques } from '../services/mitreSyncService.js';

const router = Router();

router.get('/techniques', async (req, res) => {
  try {
    const techniques = await prisma.mitreTechnique.findMany({
      orderBy: [{ tactic: 'asc' }, { id: 'asc' }],
    });

    res.json(techniques);
  } catch (error) {
    console.error('Error fetching MITRE techniques:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/techniques/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const technique = await prisma.mitreTechnique.findUnique({
      where: { id },
      include: {
        missions: {
          include: {
            mission: {
              select: {
                id: true,
                name: true,
                description: true,
                difficulty: true,
              },
            },
          },
        },
        levels: {
          include: {
            mission: {
              select: {
                id: true,
                name: true,
                description: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    if (!technique) {
      return res.status(404).json({ error: 'Technique not found' });
    }

    const missionsMap = new Map();
    technique.missions.forEach((mt) => {
      if (mt.mission) {
        missionsMap.set(mt.mission.id, mt.mission);
      }
    });
    technique.levels.forEach((level) => {
      if (level.mission) {
        missionsMap.set(level.mission.id, level.mission);
      }
    });

    res.json({
      ...technique,
      relatedMissions: Array.from(missionsMap.values()),
    });
  } catch (error) {
    console.error('Error fetching MITRE technique:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sync', async (req, res) => {
  try {
    console.log('🔄 Manual MITRE sync requested');
    const result = await syncMitreTechniques();

    res.json({
      success: true,
      message: `Synchronized ${result.synced} techniques`,
      synced: result.synced,
      errors: result.errors,
    });
  } catch (error) {
    console.error('MITRE sync error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    });
  }
});

export default router;
