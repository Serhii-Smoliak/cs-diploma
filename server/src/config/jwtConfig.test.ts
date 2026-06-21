import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('jwtConfig', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('uses fallback secret outside production', async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'development';

    const { JWT_SECRET } = await import('./jwtConfig.js');
    expect(JWT_SECRET).toBe('cybertactics-secret-key-change-in-production');
  });

  it('throws in production without JWT_SECRET', async () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';

    await expect(import('./jwtConfig.js')).rejects.toThrow('JWT_SECRET must be set');
  });

  it('exposes sign options with configured expiry', async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1h';

    const { JWT_SIGN_OPTIONS, JWT_EXPIRES_IN } = await import('./jwtConfig.js');
    expect(JWT_EXPIRES_IN).toBe('1h');
    expect(JWT_SIGN_OPTIONS.algorithm).toBe('HS256');
  });
});
