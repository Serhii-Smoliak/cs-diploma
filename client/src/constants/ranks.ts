export const RANK_TIERS = [
  { id: 'Script Kiddie', minXp: 0, icon: '📜' },
  { id: 'Novice Hacker', minXp: 500, icon: '🔰' },
  { id: 'Intermediate Hacker', minXp: 1500, icon: '⚔️' },
  { id: 'Advanced Hacker', minXp: 3000, icon: '🛡️' },
  { id: 'Elite Hacker', minXp: 5000, icon: '👑' },
] as const;

export type RankId = (typeof RANK_TIERS)[number]['id'];

export function getRankFromXp(xp: number): RankId {
  if (xp >= 5000) return 'Elite Hacker';
  if (xp >= 3000) return 'Advanced Hacker';
  if (xp >= 1500) return 'Intermediate Hacker';
  if (xp >= 500) return 'Novice Hacker';
  return 'Script Kiddie';
}

export function getNextRankXp(xp: number): number | null {
  const next = RANK_TIERS.find((tier) => tier.minXp > xp);
  return next?.minXp ?? null;
}

export function getRankXpRange(index: number): { from: number; to: number | null } {
  const tier = RANK_TIERS[index];
  const next = RANK_TIERS[index + 1];
  return { from: tier.minXp, to: next?.minXp ?? null };
}
