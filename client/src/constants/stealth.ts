/** Mirrors server defaults from stealthConfig.ts (STEALTH_MAX, STEALTH_MASKING_RESTORE). */
export const STEALTH_MAX = 100;
export const STEALTH_MASKING_RESTORE = 50;

export function wouldMaskingExceedMax(currentStealth: number): boolean {
  return currentStealth + STEALTH_MASKING_RESTORE > STEALTH_MAX;
}
