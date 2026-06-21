import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MitreTechniqueModal from './MitreTechniqueModal';

const { navigate, getMitreTechnique } = vi.hoisted(() => ({
  navigate: vi.fn(),
  getMitreTechnique: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('framer-motion', () => {
  const motionComponent = ({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>;

  return {
    motion: new Proxy(
      {},
      {
        get: () => motionComponent,
      }
    ),
    AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
    i18n: {
      resolvedLanguage: 'en',
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
}));

vi.mock('@/services/api.ts', () => ({
  api: {
    getMitreTechnique,
  },
}));

const technique = {
  id: 'T1593',
  name: 'Search Open Websites',
  description: 'Gather data from public sites.',
  tactic: 'reconnaissance',
  url: 'https://attack.mitre.org/techniques/T1593',
  platforms: ['Windows'],
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('MitreTechniqueModal', () => {
  it('loads related missions and closes on demand', async () => {
    const onClose = vi.fn();
    getMitreTechnique.mockResolvedValue({
      ...technique,
      relatedMissions: [
        { id: 'operation_ghost', name: 'Ghost', description: null, difficulty: 'beginner' },
      ],
    });

    render(
      <MemoryRouter>
        <MitreTechniqueModal technique={technique} isOpen isCompleted={false} onClose={onClose} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getMitreTechnique).toHaveBeenCalledWith('T1593');
    });

    expect(screen.getAllByText('Search Open Websites').length).toBeGreaterThan(0);
    expect(screen.getByText('Ghost')).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    await userEvent.click(closeButtons[closeButtons.length - 1]!);
    expect(onClose).toHaveBeenCalled();
  });
});
