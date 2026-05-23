import type { User as PrismaUser } from '@prisma/client';

export function formatAuthUser(
  user: PrismaUser,
  options?: { xp?: number; rank?: string; stealth?: number }
) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    xp: options?.xp ?? user.xp,
    rank: options?.rank ?? user.rank,
    stealth: options?.stealth ?? user.stealth,
    avatarUrl: user.avatarUrl,
    preferredLocale: user.preferredLocale,
    createdAt: user.createdAt.toISOString(),
  };
}
