import { describe, expect, it, vi } from 'vitest';
import { resolveOwnerUserId } from './ownership.js';

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

describe('resolveOwnerUserId', () => {
  it('returns null when user is missing', () => {
    const res = createResponse();
    expect(resolveOwnerUserId({} as never, res as never)).toBeNull();
    expect(res.statusCode).toBe(401);
  });

  it('rejects mismatched route param', () => {
    const res = createResponse();
    const result = resolveOwnerUserId({ userId: 'u1' } as never, res as never, 'u2');
    expect(result).toBeNull();
    expect(res.statusCode).toBe(403);
  });

  it('returns owner id when param matches', () => {
    const res = createResponse();
    const result = resolveOwnerUserId({ userId: 'u1' } as never, res as never, 'u1');
    expect(result).toBe('u1');
  });
});
