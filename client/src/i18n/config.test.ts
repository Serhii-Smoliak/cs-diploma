import { describe, expect, it, vi } from 'vitest';

const { addResourceBundle, i18nMock } = vi.hoisted(() => {
  const mock = {
    addResourceBundle: vi.fn(),
    reloadResources: vi.fn().mockResolvedValue(undefined),
    use: vi.fn(),
    init: vi.fn(),
  };
  mock.use.mockReturnValue(mock);
  mock.init.mockReturnValue(mock);
  return { addResourceBundle: mock.addResourceBundle, i18nMock: mock };
});

vi.mock('../services/api', () => ({
  api: {
    getTranslations: vi.fn().mockResolvedValue({ hello: 'world' }),
    getTranslationsByNamespaces: vi.fn().mockResolvedValue({ ui: { title: 'CyberTactics' } }),
  },
}));

vi.mock('i18next', () => ({
  default: i18nMock,
}));

vi.mock('react-i18next', () => ({
  initReactI18next: {},
}));

vi.mock('i18next-browser-languagedetector', () => ({
  default: {},
}));

import { loadMultipleNamespaces, loadTranslationsFromAPI } from './config';

describe('i18n config helpers', () => {
  it('loads translations from api', async () => {
    await expect(loadTranslationsFromAPI('uk', 'common')).resolves.toEqual({ hello: 'world' });
  });

  it('loads multiple namespaces', async () => {
    await expect(loadMultipleNamespaces('uk', ['ui'])).resolves.toBeUndefined();
    expect(addResourceBundle).toHaveBeenCalled();
  });
});
