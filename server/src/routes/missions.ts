import { Router } from 'express';
import prisma from '../db/database.js';
import type { Mission } from '@cybertactics/shared';
import { mapPrismaLevelToLevel } from '../utils/levelMapper.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const missions = await prisma.mission.findMany({
      include: {
        levels: {
          include: {
            mitreTechnique: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        mitreTechniquesRelation: {
          include: {
            technique: true,
          },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    const formattedMissions: Mission[] = missions.map((m) => {
      const techniquesFromRelation = new Set<string>();
      m.mitreTechniquesRelation?.forEach((rel) => {
        techniquesFromRelation.add(rel.mitreId);
      });

      const mitreTechniquesFromLevels = new Set<string>();
      m.levels.forEach((level) => {
        if (level.mitreId) {
          mitreTechniquesFromLevels.add(level.mitreId);
        }
      });

      const jsonTechniques = (m.mitreTechniques as string[]) || [];

      const allTechniques = Array.from(
        new Set([
          ...Array.from(techniquesFromRelation),
          ...jsonTechniques,
          ...Array.from(mitreTechniquesFromLevels),
        ])
      );

      return {
        id: m.id,
        name: m.name,
        description: m.description || '',
        difficulty: m.difficulty as Mission['difficulty'],
        mitreTechniques: allTechniques,
        order: m.orderIndex,
        handlerGroup: m.handlerGroup || null,
      };
    });

    res.json(formattedMissions);
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/levels', async (req, res) => {
  try {
    const { id } = req.params;

    const levels = await prisma.level.findMany({
      where: { missionId: id },
      include: {
        mitreTechnique: true,
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (levels.length === 0) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    res.json(levels.map(mapPrismaLevelToLevel));
  } catch (error) {
    console.error('Error fetching mission levels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
