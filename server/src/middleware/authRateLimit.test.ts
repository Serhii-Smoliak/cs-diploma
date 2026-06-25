import { describe, expect, it, vi } from 'vitest';

const rateLimitConfigs = vi.hoisted(
  () =>
    [] as Array<{
      handler: (
        req: unknown,
        res: { status: (code: number) => { json: (body: unknown) => void } }
      ) => void;
    }>
);

vi.mock('express-rate-limit', () => ({
  default: vi.fn((config) => {
    rateLimitConfigs.push(config);
    return vi.fn();
  }),
}));

import { authLoginLimiter, authRegisterLimiter } from './authRateLimit.js';

describe('authRateLimit', () => {
  it('exports configured limiters', () => {
    expect(authLoginLimiter).toBeDefined();
    expect(authRegisterLimiter).toBeDefined();
    expect(rateLimitConfigs).toHaveLength(2);
  });

  it('returns json error from login limiter handler', () => {
    const json = vi.fn();
    const res = { status: vi.fn(() => ({ json })) };

    rateLimitConfigs[0]!.handler({}, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      error: 'Too many login attempts. Please try again later.',
    });
  });

  it('returns json error from register limiter handler', () => {
    const json = vi.fn();
    const res = { status: vi.fn(() => ({ json })) };

    rateLimitConfigs[1]!.handler({}, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({
      error: 'Too many registration attempts. Please try again later.',
    });
  });
});
