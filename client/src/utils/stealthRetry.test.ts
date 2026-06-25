import { describe, expect, it } from 'vitest';
import { formatStealthRetryAfter } from './stealthRetry';

describe('formatStealthRetryAfter', () => {
  it('formats seconds for short delays', () => {
    expect(formatStealthRetryAfter(45_000, 'en')).toBe('45s');
    expect(formatStealthRetryAfter(45_000, 'uk')).toBe('45 сек');
  });

  it('formats minutes for medium delays', () => {
    expect(formatStealthRetryAfter(120_000, 'en')).toBe('2m');
    expect(formatStealthRetryAfter(120_000, 'uk')).toBe('2 хв');
  });

  it('formats hours and minutes for long delays', () => {
    expect(formatStealthRetryAfter(5_400_000, 'en')).toBe('1h 30m');
    expect(formatStealthRetryAfter(5_400_000, 'uk')).toBe('1 год 30 хв');
  });
});
