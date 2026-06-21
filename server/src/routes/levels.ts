import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { submitAnswer } from '../services/levelService.js';
import { HttpError } from '../errors/httpError.js';
import { z } from 'zod';

const router = Router();

const submitSchema = z.object({
  answer: z.union([
    z.string(),
    z.number(),
    z.object({
      to: z.string(),
      subject: z.string(),
      body: z.string(),
      attachments: z.array(z.string()),
    }),
    z.object({
      to: z.string().optional(),
      fields: z.record(z.string(), z.array(z.string())),
      attachments: z.array(z.string()),
    }),
  ]),
});

router.post('/:id/submit', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const levelId = decodeURIComponent(Array.isArray(id) ? id[0] : id);
    const { answer } = submitSchema.parse(req.body);

    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await submitAnswer(req.userId, levelId, answer);
    console.log('Sending response:', result);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    if (error instanceof HttpError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error('Submit answer error:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
