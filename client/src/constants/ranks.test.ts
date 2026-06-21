import { describe, expect, it } from 'vitest';
import { getNextRankXp, getRankFromXp, getRankXpRange, RANK_TIERS } from './ranks';

describe('ranks', () => {
  it('maps xp to rank tiers', () => {
    expect(getRankFromXp(0)).toBe('Script Kiddie');
    expect(getRankFromXp(499)).toBe('Script Kiddie');
    expect(getRankFromXp(500)).toBe('Novice Hacker');
    expect(getRankFromXp(1500)).toBe('Intermediate Hacker');
    expect(getRankFromXp(3000)).toBe('Advanced Hacker');
    expect(getRankFromXp(5000)).toBe('Elite Hacker');
  });

  it('returns next rank threshold', () => {
    expect(getNextRankXp(0)).toBe(500);
    expect(getNextRankXp(5000)).toBeNull();
  });

  it('returns xp range for tier index', () => {
    expect(getRankXpRange(0)).toEqual({ from: 0, to: 500 });
    expect(getRankXpRange(RANK_TIERS.length - 1)).toEqual({ from: 5000, to: null });
  });
});
