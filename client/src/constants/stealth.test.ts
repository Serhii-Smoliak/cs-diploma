import { describe, expect, it } from 'vitest';
import { STEALTH_MASKING_RESTORE, STEALTH_MAX, wouldMaskingExceedMax } from './stealth';

describe('stealth constants', () => {
  it('detects when masking would exceed max stealth', () => {
    expect(wouldMaskingExceedMax(STEALTH_MAX - STEALTH_MASKING_RESTORE)).toBe(false);
    expect(wouldMaskingExceedMax(STEALTH_MAX - STEALTH_MASKING_RESTORE + 1)).toBe(true);
    expect(wouldMaskingExceedMax(STEALTH_MAX)).toBe(true);
  });
});
