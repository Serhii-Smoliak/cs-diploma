import rateLimit from 'express-rate-limit';

const rateLimitJson = (message: string) => ({
  error: message,
});

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_LOGIN_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(rateLimitJson('Too many login attempts. Please try again later.'));
  },
});

export const authRegisterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AUTH_REGISTER_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json(rateLimitJson('Too many registration attempts. Please try again later.'));
  },
});
