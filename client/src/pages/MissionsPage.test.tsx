import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MissionsPage from './MissionsPage';
import { createFetchMock, createTestLevel, testMission } from '../test/fixtures';

const { t, i18n, navigate } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'en' },
  navigate: vi.fn(),
}));

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

vi.mock('../config/apiOrigin', () => ({
  getApiOrigin: () => 'http://localhost:4000',
  getApiBase: () => 'http://localhost:4000/api',
}));

vi.mock('../components/mitre/MitreTechniqueChip', () => ({
  default: ({ techniqueId }: { techniqueId: string }) => <span>{techniqueId}</span>,
}));

describe('MissionsPage', () => {
  beforeEach(() => {
    navigate.mockClear();
    vi.stubGlobal(
      'fetch',
      createFetchMock({
        progress: [{ levelId: 'ghost_recon_01', completed: true, attempts: 1 }],
        levels: [createTestLevel()],
      })
    );
  });

  it('loads missions and navigates on card click', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <MissionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(testMission.name)).toBeInTheDocument();
    expect(screen.getByText('T1593')).toBeInTheDocument();

    await user.click(screen.getByText(testMission.name));
    expect(navigate).toHaveBeenCalledWith('/missions/operation_ghost/assignments');
  });

  it('shows empty state when no missions returned', async () => {
    vi.stubGlobal('fetch', createFetchMock({ missions: [] }));

    render(
      <MemoryRouter>
        <MissionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('noMissionsAvailable')).toBeInTheDocument();
  });

  it('marks mission without levels as none', async () => {
    vi.stubGlobal('fetch', createFetchMock({ levels: [], progress: [] }));

    render(
      <MemoryRouter>
        <MissionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(testMission.name)).toBeInTheDocument();
  });

  it('marks mission as in progress when attempts exist', async () => {
    vi.stubGlobal(
      'fetch',
      createFetchMock({
        progress: [{ levelId: 'ghost_recon_01', completed: false, attempts: 2 }],
      })
    );

    render(
      <MemoryRouter>
        <MissionsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(testMission.name)).toBeInTheDocument();
  });

  it('continues rendering when mission load fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    render(
      <MemoryRouter>
        <MissionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('noMissionsAvailable')).toBeInTheDocument();
    });
  });
});
