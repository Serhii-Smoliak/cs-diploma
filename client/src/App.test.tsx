import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { createFetchMock, createTestLevel, testMission } from './test/fixtures';

const {
  t,
  i18n,
  isAuthenticated,
  refreshUser,
  logout,
  resetGame,
  setMission,
  loadLevel,
  currentMission,
  currentLevel,
} = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'en' },
  isAuthenticated: { value: false },
  refreshUser: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  resetGame: vi.fn(),
  setMission: vi.fn().mockResolvedValue(undefined),
  loadLevel: vi.fn().mockResolvedValue(undefined),
  currentMission: { value: null as { id: string } | null },
  currentLevel: { value: null as { level_id: string } | null },
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
    currentMission: currentMission.value,
    currentLevel: currentLevel.value,
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

vi.mock('./pages/MissionsPage', () => ({
  default: () => <div>Operation Ghost</div>,
}));

vi.mock('./auth/sessionExpired', () => ({
  registerSessionExpiredHandler: vi.fn(),
}));

const getToken = vi.hoisted(() =>
  vi.fn(() => (typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null))
);

vi.mock('./services/api', () => ({
  api: {
    getToken,
    getMissions: vi.fn(),
    getMissionLevels: vi.fn(),
  },
}));

import { api } from './services/api';

describe('App', () => {
  beforeEach(() => {
    isAuthenticated.value = false;
    currentMission.value = testMission;
    currentLevel.value = createTestLevel();
    refreshUser.mockClear();
    refreshUser.mockResolvedValue(undefined);
    logout.mockClear();
    setMission.mockClear();
    loadLevel.mockClear();
    vi.mocked(api.getMissions).mockClear();
    vi.mocked(api.getMissionLevels).mockClear();
    vi.mocked(api.getMissions).mockResolvedValue([testMission]);
    vi.mocked(api.getMissionLevels).mockResolvedValue([createTestLevel()]);
    getToken.mockImplementation(() => localStorage.getItem('auth_token'));
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

  it('shows loading while session is validated', () => {
    isAuthenticated.value = true;
    apiSetToken();
    refreshUser.mockImplementation(() => new Promise(() => undefined));

    render(
      <MemoryRouter initialEntries={['/missions']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('logs out guest with stale auth flag but no token', async () => {
    isAuthenticated.value = true;
    localStorage.removeItem('auth_token');
    getToken.mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/missions']}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
    });
  });

  it('redirects game route when mission is missing from API', async () => {
    isAuthenticated.value = true;
    currentMission.value = null;
    currentLevel.value = null;
    apiSetToken();
    vi.mocked(api.getMissions).mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={['/missions/operation_ghost/assignments/ghost_recon_01']}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Operation Ghost')).toBeInTheDocument();
    expect(setMission).not.toHaveBeenCalled();
  });

  it('redirects game route when assignment is missing', async () => {
    isAuthenticated.value = true;
    currentMission.value = null;
    currentLevel.value = null;
    apiSetToken();
    vi.mocked(api.getMissionLevels).mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={['/missions/operation_ghost/assignments/ghost_recon_01']}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Operation Ghost')).toBeInTheDocument();
    expect(loadLevel).not.toHaveBeenCalled();
  });

  it('redirects game route when restore throws', async () => {
    isAuthenticated.value = true;
    currentMission.value = null;
    currentLevel.value = null;
    apiSetToken();
    vi.mocked(api.getMissions).mockRejectedValueOnce(new Error('network down'));

    render(
      <MemoryRouter initialEntries={['/missions/operation_ghost/assignments/ghost_recon_01']}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Operation Ghost')).toBeInTheDocument();
  });

  it('skips restore when mission and level already loaded', async () => {
    isAuthenticated.value = true;
    currentMission.value = testMission;
    currentLevel.value = createTestLevel();
    apiSetToken();

    render(
      <MemoryRouter initialEntries={['/missions/operation_ghost/assignments/ghost_recon_01']}>
        <Routes>
          <Route path="/*" element={<App />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('game-layout')).toBeInTheDocument();
    expect(api.getMissions).not.toHaveBeenCalled();
  });
});

function apiSetToken() {
  localStorage.setItem('auth_token', 'token');
}
