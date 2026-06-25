import { describe, expect, it } from 'vitest';
import {
  STEALTH_MASKING_RESTORE,
  STEALTH_MAX,
  isStealthAtMax,
  wouldMaskingExceedMax,
} from './stealth';

describe('stealth constants', () => {
  it('detects when masking would exceed max stealth', () => {
    expect(wouldMaskingExceedMax(STEALTH_MAX - STEALTH_MASKING_RESTORE)).toBe(false);
    expect(wouldMaskingExceedMax(STEALTH_MAX - STEALTH_MASKING_RESTORE + 1)).toBe(true);
    expect(wouldMaskingExceedMax(STEALTH_MAX)).toBe(true);
  });

  it('detects when stealth is already at max', () => {
    expect(isStealthAtMax(STEALTH_MAX)).toBe(true);
    expect(isStealthAtMax(STEALTH_MAX - 1)).toBe(false);
  });
});
