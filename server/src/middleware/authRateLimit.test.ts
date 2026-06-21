import { describe, expect, it } from 'vitest';
import { authLoginLimiter, authRegisterLimiter } from './authRateLimit.js';

describe('authRateLimit', () => {
  it('exports configured limiters', () => {
    expect(authLoginLimiter).toBeDefined();
    expect(authRegisterLimiter).toBeDefined();
  });
});
