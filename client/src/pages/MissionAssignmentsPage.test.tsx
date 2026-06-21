import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MissionAssignmentsPage from './MissionAssignmentsPage';
import { createFetchMock, createTestLevel, testMission } from '../test/fixtures';

const { t, i18n, navigate, setMission, loadLevel } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string; count?: number }) => {
    if (options?.defaultValue) return options.defaultValue;
    if (options?.count !== undefined) return `${key}:${options.count}`;
    return key;
  },
  i18n: { resolvedLanguage: 'en', language: 'en', on: vi.fn(), off: vi.fn() },
  navigate: vi.fn(),
  setMission: vi.fn().mockResolvedValue(undefined),
  loadLevel: vi.fn().mockResolvedValue(undefined),
}));

const levels = [
  createTestLevel(),
  createTestLevel({ level_id: 'ghost_02', title: 'Second task', order: 2 }),
];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../i18n/config', () => ({
  default: i18n,
  loadMultipleNamespaces: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../store/gameStore', () => ({
  useGameStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      currentMission: testMission,
      levels,
      setMission,
      loadLevel,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: { id: 'u1' } }),
  },
}));

vi.mock('../config/apiOrigin', () => ({
  getApiOrigin: () => 'http://localhost:4000',
  getApiBase: () => 'http://localhost:4000/api',
}));

vi.mock('../components/mitre/MitreTechniqueChip', () => ({
  default: ({ techniqueId }: { techniqueId: string }) => <span>{techniqueId}</span>,
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/missions/operation_ghost/assignments']}>
      <Routes>
        <Route path="/missions/:missionId/assignments" element={<MissionAssignmentsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('MissionAssignmentsPage', () => {
  beforeEach(() => {
    navigate.mockClear();
    setMission.mockClear();
    loadLevel.mockClear();
    vi.stubGlobal('fetch', createFetchMock({ levels }));
  });

  it('renders mission assignments and kill chain', async () => {
    renderPage();

    expect(await screen.findByText(testMission.name)).toBeInTheDocument();
    expect(screen.getByTitle('Show Cyber Kill Chain')).toBeInTheDocument();
    expect(screen.getByText('Find admin email')).toBeInTheDocument();
  });

  it('selects assignment and starts mission level', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Find admin email');
    await user.click(screen.getByRole('button', { name: /Find admin email/i }));

    const startButtons = screen.getAllByRole('button', { name: 'Start assignment' });
    await user.click(startButtons[0]!);

    expect(loadLevel).toHaveBeenCalledWith('ghost_recon_01');
    expect(navigate).toHaveBeenCalledWith('/missions/operation_ghost/assignments/ghost_recon_01');
  });

  it('toggles kill chain section', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByTitle('Show Cyber Kill Chain'));
    expect(screen.getByText(/Reconnaissance/)).toBeInTheDocument();
  });
});
