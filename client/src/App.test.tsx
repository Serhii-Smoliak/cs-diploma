import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { createFetchMock, createTestLevel, testMission } from './test/fixtures';

const { t, i18n, isAuthenticated, refreshUser, logout, resetGame, setMission, loadLevel } =
  vi.hoisted(() => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: { resolvedLanguage: 'en' },
    isAuthenticated: { value: false },
    refreshUser: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    resetGame: vi.fn(),
    setMission: vi.fn().mockResolvedValue(undefined),
    loadLevel: vi.fn().mockResolvedValue(undefined),
  }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('./i18n/config', () => ({
  default: i18n,
  loadMultipleNamespaces: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./store/authStore', () => {
  const getState = () => ({
    isAuthenticated: isAuthenticated.value,
    refreshUser,
    logout,
    user: isAuthenticated.value
      ? {
          id: 'u1',
          username: 'agent',
          email: 'agent@test.com',
          xp: 100,
          rank: 'Novice Hacker',
          stealth: 80,
          preferredLocale: 'en',
          createdAt: '2026-01-01T00:00:00.000Z',
        }
      : null,
  });

  return {
    useAuthStore: Object.assign(
      (selector?: (state: ReturnType<typeof getState>) => unknown) => {
        const state = getState();
        return selector ? selector(state) : state;
      },
      { getState }
    ),
  };
});

vi.mock('./store/gameStore', () => {
  const getState = () => ({
    reset: resetGame,
    currentMission: testMission,
    currentLevel: createTestLevel(),
    setMission,
    loadLevel,
  });

  return {
    useGameStore: Object.assign(
      (selector?: (state: ReturnType<typeof getState>) => unknown) => {
        const state = getState();
        return selector ? selector(state) : state;
      },
      { getState }
    ),
  };
});

vi.mock('./components/auth/LocaleSelectionGate', () => ({
  default: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('./components/layout/Layout', () => ({
  default: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));

vi.mock('./components/game/GameLayout', () => ({
  default: () => <div>game-layout</div>,
}));

vi.mock('./auth/sessionExpired', () => ({
  registerSessionExpiredHandler: vi.fn(),
}));

describe('App', () => {
  beforeEach(() => {
    isAuthenticated.value = false;
    refreshUser.mockClear();
    vi.stubGlobal('fetch', createFetchMock());
  });

  it('shows login page for guests', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByText('CyberTactics')).toBeInTheDocument();
  });

  it('redirects authenticated users away from login', async () => {
    isAuthenticated.value = true;
    apiSetToken();

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Operation Ghost')).toBeInTheDocument();
  });

  it('restores game route when mission and level exist', async () => {
    isAuthenticated.value = true;
    apiSetToken();

    render(
      <MemoryRouter initialEntries={['/missions/operation_ghost/assignments/ghost_recon_01']}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('game-layout')).toBeInTheDocument();
  });
});

function apiSetToken() {
  localStorage.setItem('auth_token', 'token');
}
