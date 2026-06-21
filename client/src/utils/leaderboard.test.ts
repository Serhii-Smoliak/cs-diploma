import { describe, expect, it } from 'vitest';
import { getPositionDisplay, getPositionLabel } from './leaderboard';

describe('getPositionDisplay', () => {
  it('returns medals for top three positions', () => {
    expect(getPositionDisplay(1)).toEqual({ kind: 'medal', label: '🥇' });
    expect(getPositionDisplay(2)).toEqual({ kind: 'medal', label: '🥈' });
    expect(getPositionDisplay(3)).toEqual({ kind: 'medal', label: '🥉' });
  });

  it('returns rank badge data for fourth place and below', () => {
    expect(getPositionDisplay(4)).toEqual({ kind: 'rank', label: '4' });
    expect(getPositionDisplay(5)).toEqual({ kind: 'rank', label: '5' });
    expect(getPositionDisplay(6)).toEqual({ kind: 'rank', label: '6' });
    expect(getPositionDisplay(10)).toEqual({ kind: 'rank', label: '10' });
  });
});

describe('getPositionLabel', () => {
  it('returns display label for any position', () => {
    expect(getPositionLabel(1)).toBe('🥇');
    expect(getPositionLabel(4)).toBe('4');
    expect(getPositionLabel(10)).toBe('10');
  });
});
