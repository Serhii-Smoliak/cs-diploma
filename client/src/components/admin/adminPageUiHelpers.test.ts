import { describe, expect, it, vi } from 'vitest';
import {
  adminCancelLabel,
  adminDeleteLabels,
  adminErrorText,
  adminLoadingLabel,
  adminUiText,
  localizedDefault,
  toErrorMessage,
} from './adminPageUiHelpers';

const t = vi.fn((key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key);

describe('adminPageUiHelpers', () => {
  it('returns localized default by locale', () => {
    expect(localizedDefault(false, 'Українська', 'English')).toBe('Українська');
    expect(localizedDefault(true, 'Українська', 'English')).toBe('English');
  });

  it('builds common admin labels', () => {
    expect(adminLoadingLabel(t, false)).toBe('Завантаження...');
    expect(adminCancelLabel(t, true)).toBe('Cancel');
    expect(adminDeleteLabels(t, false)).toEqual({
      confirmLabel: 'Видалити',
      loadingLabel: 'Видалення...',
    });
  });

  it('builds adminUiText with defaultValue', () => {
    expect(adminUiText(t, false, 'adminTickets', 'Звернення', 'Support tickets')).toBe('Звернення');
    expect(adminUiText(t, true, 'adminTickets', 'Звернення', 'Support tickets')).toBe(
      'Support tickets'
    );
  });

  it('extracts error message from Error or fallback', () => {
    expect(toErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
    expect(toErrorMessage('x', 'fallback')).toBe('fallback');
    expect(
      adminErrorText(t, false, 'adminTicketsReplyError', 'Помилка', 'Error', new Error('boom'))
    ).toBe('boom');
    expect(adminErrorText(t, false, 'adminTicketsReplyError', 'Помилка', 'Error', 'x')).toBe(
      'Помилка'
    );
  });
});
