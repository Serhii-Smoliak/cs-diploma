import { beforeEach, describe, expect, it, vi } from 'vitest';

const { changeLanguage, emit, loadMultipleNamespaces } = vi.hoisted(() => ({
  changeLanguage: vi.fn().mockResolvedValue(undefined),
  emit: vi.fn(),
  loadMultipleNamespaces: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./config', () => ({
  default: { changeLanguage, emit },
  loadMultipleNamespaces,
}));

vi.mock('./namespaces', () => ({
  I18N_NAMESPACES: ['common', 'ui'],
}));

import { applyLocale, normalizeLocale } from './applyLocale';

describe('normalizeLocale', () => {
  it('maps english variants to en', () => {
    expect(normalizeLocale('en')).toBe('en');
    expect(normalizeLocale('en-US')).toBe('en');
  });

  it('defaults other locales to uk', () => {
    expect(normalizeLocale('uk')).toBe('uk');
    expect(normalizeLocale('de')).toBe('uk');
  });
});

describe('applyLocale', () => {
  beforeEach(() => {
    changeLanguage.mockClear();
    emit.mockClear();
    loadMultipleNamespaces.mockClear();
  });

  it('loads namespaces, switches language and persists locale', async () => {
    await applyLocale('en-US');

    expect(loadMultipleNamespaces).toHaveBeenCalledWith('en', ['common', 'ui']);
    expect(changeLanguage).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('i18nextLng')).toBe('en');
    expect(emit).toHaveBeenCalledWith('loaded');
  });
});
