import { describe, expect, it, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticate, type AuthRequest } from './auth.js';

vi.mock('../config/jwtConfig.js', () => ({
  JWT_SECRET: 'test-secret',
}));

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../db/database.js', () => ({ default: prismaMock }));

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
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
  });

  it('rejects missing bearer token', async () => {
    const req = { headers: {} };
    const res = createResponse();
    const next = vi.fn();

    await authenticate(req as never, res as never, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts valid token for active user', async () => {
    const token = jwt.sign({ userId: 'u1', email: 'agent@test.com' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = createResponse();
    const next = vi.fn();

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'agent@test.com',
      isBlocked: false,
    });

    await authenticate(req as never, res as never, next);

    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe('u1');
    expect(req.userEmail).toBe('agent@test.com');
  });

  it('rejects blocked users', async () => {
    const token = jwt.sign({ userId: 'u1', email: 'agent@test.com' }, 'test-secret');
    const req = { headers: { authorization: `Bearer ${token}` } } as AuthRequest;
    const res = createResponse();
    const next = vi.fn();

    prismaMock.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'agent@test.com',
      isBlocked: true,
    });

    await authenticate(req as never, res as never, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Account blocked' });
    expect(next).not.toHaveBeenCalled();
  });
});
