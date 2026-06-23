import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/jwtConfig.js';
import prisma from '../db/database.js';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isBlocked: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: 'Account blocked' });
      return;
    }

    req.userId = user.id;
    req.userEmail = user.email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
