import type { SignOptions } from 'jsonwebtoken';

const DEV_JWT_FALLBACK = 'cybertactics-secret-key-change-in-production';

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret && isProduction) {
    throw new Error('JWT_SECRET must be set when NODE_ENV=production');
  }

  return secret || DEV_JWT_FALLBACK;
}

export const JWT_SECRET = resolveJwtSecret();

/** e.g. "7d", "24h" — see jsonwebtoken expiresIn */
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN?.trim() || '7d';

export const JWT_SIGN_OPTIONS: SignOptions = {
  expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'],
  algorithm: 'HS256',
};
