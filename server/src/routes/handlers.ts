import { Router } from 'express';
import prisma from '../db/database.js';

const router = Router();

router.get('/random/:group', async (req, res) => {
  try {
    const { group } = req.params;

    const handlers = await prisma.handler.findMany({
      where: {
        group,
        isActive: true,
      },
    });

    if (handlers.length === 0) {
      return res.status(404).json({ error: 'No handlers found for this group' });
    }

    const randomHandler = handlers[Math.floor(Math.random() * handlers.length)];

    res.json({
      codeName: randomHandler.codeName,
      group: randomHandler.group,
      specialization: randomHandler.specialization,
    });
  } catch (error) {
    console.error('Error fetching handler:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

