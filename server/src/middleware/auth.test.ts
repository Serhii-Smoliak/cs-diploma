import { describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate, type AuthRequest } from './auth.js';

vi.mock('../config/jwtConfig.js', () => ({
  JWT_SECRET: 'test-secret',
}));

function createResponse() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('authenticate middleware', () => {
  it('rejects missing bearer token', () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = vi.fn();

    authenticate(req as never, res as never, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid token', () => {
    const token = jwt.sign({ userId: 'u1', email: 'agent@test.com' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = createResponse();
    const next = vi.fn();

    authenticate(req as never, res as never, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('u1');
    expect(req.userEmail).toBe('agent@test.com');
  });
});
