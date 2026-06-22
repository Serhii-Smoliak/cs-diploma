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

  it('uses uk when authenticated user has no preferred locale', async () => {
    vi.resetModules();
    localStorage.setItem(
      'cybertactics-auth',
      JSON.stringify({
        state: {
          isAuthenticated: true,
          user: { preferredLocale: null },
        },
      })
    );

    await import('./main.tsx');

    await vi.waitFor(() => {
      expect(applyLocale).toHaveBeenCalledWith('uk');
    });
  });

  it('uses english from i18next storage when auth is absent', async () => {
    vi.resetModules();
    localStorage.setItem('i18nextLng', 'en-US');

    await import('./main.tsx');

    await vi.waitFor(() => {
      expect(applyLocale).toHaveBeenCalledWith('en');
    });
  });

  it('ignores malformed persisted auth json', async () => {
    vi.resetModules();
    localStorage.setItem('cybertactics-auth', '{bad-json');

    await import('./main.tsx');

    await vi.waitFor(() => {
      expect(applyLocale).toHaveBeenCalledWith('uk');
    });
  });

  it('logs bootstrap errors when locale init fails', async () => {
    vi.resetModules();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    applyLocale.mockRejectedValueOnce(new Error('locale failed'));

    await import('./main.tsx');

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });
    consoleError.mockRestore();
  });
});
