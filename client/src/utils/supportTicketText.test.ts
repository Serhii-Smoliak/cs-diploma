import { describe, expect, it, vi } from 'vitest';
import type { TFunction } from 'i18next';
import { getSupportCloseReasonLabel, SUPPORT_CLOSE_REASON_OPTIONS } from './supportTicketText';

const t = vi.fn((key: string, options?: { ns?: string; defaultValue?: string }) => {
  return options?.defaultValue ?? key;
}) as unknown as TFunction;

describe('supportTicketText', () => {
  it('returns null when close reason missing', () => {
    expect(getSupportCloseReasonLabel(null, null, t, false)).toBeNull();
  });

  it('returns custom reason text', () => {
    expect(getSupportCloseReasonLabel('CUSTOM', '  Custom note  ', t, false)).toBe('Custom note');
  });

  it('returns null for empty custom reason', () => {
    expect(getSupportCloseReasonLabel('CUSTOM', '   ', t, false)).toBeNull();
  });

  it('returns translated preset reasons', () => {
    expect(getSupportCloseReasonLabel('ANSWERED', null, t, false)).toBe('Відповідь надана');
    expect(getSupportCloseReasonLabel('DECLINED', null, t, true)).toBe(
      'Request does not meet requirements'
    );
  });

  it('exports all close reason options', () => {
    expect(SUPPORT_CLOSE_REASON_OPTIONS).toEqual(['ANSWERED', 'DECLINED', 'CUSTOM']);
  });
});
