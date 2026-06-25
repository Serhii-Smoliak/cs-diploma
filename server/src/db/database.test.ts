import { describe, expect, it, vi } from 'vitest';

vi.mock('@prisma/client', () => ({
  PrismaClient: class MockPrismaClient {
    mocked = true;
  },
}));

import prisma from './database.js';

describe('database', () => {
  it('exports prisma client instance', () => {
    expect(prisma).toEqual({ mocked: true });
  });
});
