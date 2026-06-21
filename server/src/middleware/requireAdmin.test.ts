import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
}));

vi.mock('../db/database.js', () => ({
  default: prismaMock,
}));

import { requireAdmin } from './requireAdmin.js';

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

describe('requireAdmin', () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockReset();
  });

  it('rejects unauthenticated requests', async () => {
    const res = createResponse();
    const next = vi.fn();

    await requireAdmin({} as never, res as never, next);

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows admin users', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });
    const res = createResponse();
    const next = vi.fn();

    await requireAdmin({ userId: 'admin-1' } as never, res as never, next);

    expect(next).toHaveBeenCalled();
  });

  it('rejects non-admin users', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: UserRole.USER });
    const res = createResponse();
    const next = vi.fn();

    await requireAdmin({ userId: 'user-1' } as never, res as never, next);

    expect(res.statusCode).toBe(403);
  });
});
