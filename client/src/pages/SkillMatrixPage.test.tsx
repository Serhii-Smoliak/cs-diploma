import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SkillMatrixPage from './SkillMatrixPage';
import { createFetchMock, testMitreTechnique } from '../test/fixtures';

const { t, mockUser, i18n } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'uk', language: 'uk' },
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
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../i18n/config', () => ({
  loadMultipleNamespaces: vi.fn().mockResolvedValue(undefined),
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

  afterEach(() => {
    vi.useRealTimers();
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

  it('opens technique from query param after data load', async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(
      <MemoryRouter initialEntries={['/skill-matrix?technique=T1593']}>
        <Routes>
          <Route path="/skill-matrix" element={<SkillMatrixPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('close-modal', {}, { timeout: 3000 })).toBeInTheDocument();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled(), { timeout: 2000 });
  });

  it('toggles tactic section expansion', async () => {
    const userEvents = userEvent.setup();

    render(
      <MemoryRouter>
        <SkillMatrixPage />
      </MemoryRouter>
    );

    await screen.findByText('reconnaissance');
    const tacticButton = screen.getByRole('button', { name: /reconnaissance/i });
    await userEvents.click(tacticButton);
    await userEvents.click(tacticButton);
  });

  it('shows loading state before data arrives', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => [],
                }),
              100
            );
          })
      )
    );

    render(
      <MemoryRouter>
        <SkillMatrixPage />
      </MemoryRouter>
    );

    expect(screen.getByText('loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });
  });

  it('closes technique modal', async () => {
    const userEvents = userEvent.setup();

    render(
      <MemoryRouter>
        <SkillMatrixPage />
      </MemoryRouter>
    );

    await screen.findByText('reconnaissance');
    await userEvents.click(screen.getByTitle('expandAll'));
    await userEvents.click(screen.getByText(testMitreTechnique.name));
    await userEvents.click(screen.getByText('close-modal'));

    expect(screen.queryByText('close-modal')).not.toBeInTheDocument();
  });

  it('shows only completed techniques when filter is completed', async () => {
    const userEvents = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      createFetchMock({
        techniques: [
          testMitreTechnique,
          {
            ...testMitreTechnique,
            id: 'T1005',
            name: 'Data from Local System',
            tactic: 'collection',
          },
        ],
        stats: { mitreTechniques: ['T1593'] },
      })
    );

    render(
      <MemoryRouter>
        <SkillMatrixPage />
      </MemoryRouter>
    );

    await screen.findByText('reconnaissance');
    await userEvents.click(screen.getByTitle('expandAll'));
    await userEvents.selectOptions(screen.getByRole('combobox'), 'completed');

    expect(screen.getByText(testMitreTechnique.name)).toBeInTheDocument();
    expect(screen.queryByText('Data from Local System')).not.toBeInTheDocument();
  });
});
