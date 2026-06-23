import { UserRole } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { formatAuthUser } from './formatUser';

describe('formatAuthUser', () => {
  it('maps prisma user to auth payload', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const user = {
      id: 'u1',
      username: 'agent',
      email: 'agent@test.com',
      xp: 100,
      rank: 'Script Kiddie',
      stealth: 80,
      avatarUrl: '/uploads/a.png',
      preferredLocale: 'uk',
      createdAt,
      passwordHash: 'hash',
      role: UserRole.USER,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
    };

    expect(formatAuthUser(user)).toEqual({
      id: 'u1',
      username: 'agent',
      email: 'agent@test.com',
      role: UserRole.USER,
      xp: 100,
      rank: 'Script Kiddie',
      stealth: 80,
      avatarUrl: '/uploads/a.png',
      preferredLocale: 'uk',
      createdAt: createdAt.toISOString(),
    });
  });

  it('allows overriding xp, rank and stealth', () => {
    const user = {
      id: 'u1',
      username: 'agent',
      email: 'agent@test.com',
      xp: 100,
      rank: 'Script Kiddie',
      stealth: 80,
      avatarUrl: null,
      preferredLocale: 'en',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      passwordHash: 'hash',
      role: UserRole.USER,
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
    };

    expect(formatAuthUser(user, { xp: 500, rank: 'Novice Hacker', stealth: 40 })).toMatchObject({
      xp: 500,
      rank: 'Novice Hacker',
      stealth: 40,
    });
  });
});
