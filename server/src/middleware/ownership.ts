import { Response } from 'express';
import { z } from 'zod';
import type { AuthRequest } from './auth.js';

const userIdParamSchema = z.string().min(1).max(128);

/**
 * Returns the authenticated user's id from JWT only.
 * Optionally rejects when a URL param id does not match (legacy /users/:id/* routes).
 */
export function resolveOwnerUserId(
  req: AuthRequest,
  res: Response,
  paramId?: string
): string | null {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  if (paramId !== undefined) {
    const parsed = userIdParamSchema.safeParse(paramId);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid user id' });
      return null;
    }
    if (parsed.data !== userId) {
      res.status(403).json({ error: 'Forbidden' });
      return null;
    }
  }

  return userId;
}
