import { describe, expect, it } from 'vitest';
import { getRankLabel } from './rank';

describe('getRankLabel', () => {
  it('returns translated label when key exists', () => {
    const t = ((key: string, options?: { defaultValue?: string }) =>
      key === 'rank.Elite Hacker' ? 'Elite' : (options?.defaultValue ?? key)) as never;

    expect(getRankLabel('Elite Hacker', t)).toBe('Elite');
  });

  it('falls back to rank id when translation is missing', () => {
    const t = ((key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key) as never;
    expect(getRankLabel('Novice Hacker', t)).toBe('Novice Hacker');
  });
});
