import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SkillMatrixPage from './SkillMatrixPage';
import { createFetchMock, testMitreTechnique } from '../test/fixtures';

const { t, mockUser } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  mockUser: {
    id: 'u1',
    username: 'agent',
    email: 'agent@test.com',
    xp: 100,
    rank: 'Novice Hacker',
    stealth: 80,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t }),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector?: (state: { user: typeof mockUser }) => unknown) => {
    const state = { user: mockUser };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../components/mitre/MitreTechniqueModal', () => ({
  default: ({
    technique,
    isOpen,
    onClose,
  }: {
    technique: { name: string } | null;
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div>
        <span>{technique?.name}</span>
        <button type="button" onClick={onClose}>
          close-modal
        </button>
      </div>
    ) : null,
}));

vi.mock('../config/apiOrigin', () => ({
  getApiOrigin: () => 'http://localhost:4000',
  getApiBase: () => 'http://localhost:4000/api',
}));

describe('SkillMatrixPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', createFetchMock());
  });

  it('renders tactics and opens technique modal', async () => {
    const userEvents = userEvent.setup();

    render(
      <MemoryRouter>
        <SkillMatrixPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('reconnaissance')).toBeInTheDocument();

    await userEvents.click(screen.getByTitle('expandAll'));
    expect(await screen.findByText(testMitreTechnique.name)).toBeInTheDocument();

    await userEvents.click(screen.getByText(testMitreTechnique.name));
    expect(screen.getByText('close-modal')).toBeInTheDocument();
  });

  it('filters techniques by search query', async () => {
    const userEvents = userEvent.setup();

    render(
      <MemoryRouter>
        <SkillMatrixPage />
      </MemoryRouter>
    );

    await screen.findByText('reconnaissance');
    await userEvents.click(screen.getByTitle('expandAll'));
    await screen.findByText(testMitreTechnique.name);
    await userEvents.type(screen.getByPlaceholderText('searchPlaceholder'), 'missing-technique');

    expect(screen.queryByText(testMitreTechnique.name)).not.toBeInTheDocument();
  });

  it('collapses all tactics and toggles completed filter', async () => {
    const userEvents = userEvent.setup();

    render(
      <MemoryRouter>
        <SkillMatrixPage />
      </MemoryRouter>
    );

    await screen.findByText('reconnaissance');
    await userEvents.click(screen.getByTitle('expandAll'));
    await screen.findByText(testMitreTechnique.name);
    await userEvents.click(screen.getByTitle('collapseAll'));
    await userEvents.selectOptions(screen.getByRole('combobox'), 'completed');
    await userEvents.selectOptions(screen.getByRole('combobox'), 'incomplete');
    await userEvents.selectOptions(screen.getByRole('combobox'), 'all');

    expect(screen.getByText('reconnaissance')).toBeInTheDocument();
  });
});
