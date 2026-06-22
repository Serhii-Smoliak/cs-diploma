import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyLocale = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const renderRoot = vi.hoisted(() => vi.fn());

vi.mock('./App.tsx', () => ({ default: () => null }));
vi.mock('./styles/index.css', () => ({}));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: renderRoot }),
}));
vi.mock('./i18n/applyLocale', () => ({
  applyLocale,
  normalizeLocale: (value: string) => (value.startsWith('en') ? 'en' : 'uk'),
}));

describe('main bootstrap', () => {
  beforeEach(() => {
    localStorage.clear();
    applyLocale.mockClear();
    renderRoot.mockClear();
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('uses preferred locale from persisted auth', async () => {
    localStorage.setItem(
      'cybertactics-auth',
      JSON.stringify({
        state: {
          isAuthenticated: true,
          user: { preferredLocale: 'en' },
        },
      })
    );

    await import('./main.tsx');

    await vi.waitFor(() => {
      expect(applyLocale).toHaveBeenCalledWith('en');
      expect(renderRoot).toHaveBeenCalled();
    });
  });

  it('falls back to uk when auth is missing', async () => {
    vi.resetModules();
    await import('./main.tsx');

    await vi.waitFor(() => {
      expect(applyLocale).toHaveBeenCalledWith('uk');
    });
  });
});
