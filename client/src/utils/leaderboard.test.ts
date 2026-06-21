import { describe, expect, it } from 'vitest';
import { getPositionLabel } from './leaderboard';

describe('getPositionLabel', () => {
  it('returns medals for top three positions', () => {
    expect(getPositionLabel(1)).toBe('🥇');
    expect(getPositionLabel(2)).toBe('🥈');
    expect(getPositionLabel(3)).toBe('🥉');
  });

  it('returns numeric label for other positions', () => {
    expect(getPositionLabel(4)).toBe('4');
    expect(getPositionLabel(10)).toBe('10');
  });
});
