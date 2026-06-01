import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../db/database.js';
import { JWT_SECRET, JWT_SIGN_OPTIONS } from '../config/jwtConfig.js';
import { authLoginLimiter, authRegisterLimiter } from '../middleware/authRateLimit.js';
import { applyPassiveRegen } from '../services/stealthService.js';
import { formatAuthUser } from '../utils/formatUser.js';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Register
router.post('/register', authRegisterLimiter, async (req, res) => {
  try {
    const { username, email, password } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Unable to register with these credentials' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and stats in transaction
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        xp: 0,
        rank: 'Script Kiddie',
        stealth: 100,
        stats: {
          create: {
            totalXp: 0,
            rank: 'Script Kiddie',
            stealth: 100,
            completedLevels: 0,
          },
        },
      },
    });

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, JWT_SIGN_OPTIONS);

    res.status(201).json({
      token,
      user: formatAuthUser(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', authLoginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { stats: true },
    });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, JWT_SIGN_OPTIONS);

    const stealth = await applyPassiveRegen(user.id);

    res.json({
      token,
      user: formatAuthUser(user, {
        xp: user.stats?.totalXp || 0,
        rank: user.stats?.rank || 'Script Kiddie',
        stealth,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request' });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
