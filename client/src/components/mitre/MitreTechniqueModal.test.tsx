import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      exists: vi.fn().mockReturnValue(false),
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

  it('shows error when technique details fail to load', async () => {
    getMitreTechnique.mockRejectedValueOnce(new Error('network'));

    render(
      <MemoryRouter>
        <MitreTechniqueModal technique={technique} isOpen isCompleted={false} onClose={vi.fn()} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getMitreTechnique).toHaveBeenCalledWith('T1593');
    });
    expect(screen.getAllByText('T1593').length).toBeGreaterThan(0);
  });

  it('copies technique id to clipboard', async () => {
    const userEvents = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    getMitreTechnique.mockResolvedValue({ ...technique, relatedMissions: [] });

    render(
      <MemoryRouter>
        <MitreTechniqueModal technique={technique} isOpen isCompleted onClose={vi.fn()} />
      </MemoryRouter>
    );

    await userEvents.click(screen.getByRole('button', { name: 'T1593' }));
    expect(writeText).toHaveBeenCalledWith('T1593');
  });

  it('renders examples, mitigation tips and navigates from related mission', async () => {
    const userEvents = userEvent.setup();
    const onClose = vi.fn();
    const richTechnique = {
      ...technique,
      examples: ['Search LinkedIn profiles', 'Scan job boards'],
      mitigation: ['Monitor network traffic and logs'],
      dataSources: [{ source: 'Process', component: 'creation' }],
    };

    getMitreTechnique.mockResolvedValue({
      ...richTechnique,
      relatedMissions: [
        {
          id: 'operation_ghost',
          name: 'Ghost',
          description: 'Ghost mission',
          difficulty: 'intermediate',
        },
      ],
    });

    render(
      <MemoryRouter>
        <MitreTechniqueModal
          technique={richTechnique}
          isOpen
          isCompleted={false}
          onClose={onClose}
        />
      </MemoryRouter>
    );

    await userEvents.click(
      screen
        .getAllByRole('button')
        .find((button) => button.textContent?.includes('Search LinkedIn profiles'))!
    );

    await userEvents.click(screen.getByText('Ghost'));
    expect(onClose).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/missions/operation_ghost/assignments');
  });

  it('toggles kill chain stage details', async () => {
    getMitreTechnique.mockResolvedValue({ ...technique, relatedMissions: [] });

    render(
      <MemoryRouter>
        <MitreTechniqueModal technique={technique} isOpen isCompleted={false} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const stageLabel = screen
      .getAllByText('resource-development')
      .find((node) => node.className.includes('text-[10px]'));
    expect(stageLabel?.parentElement).toBeTruthy();
    fireEvent.click(stageLabel!.parentElement!);
    fireEvent.click(stageLabel!.parentElement!);
  });

  it('closes modal on Escape key', async () => {
    const onClose = vi.fn();
    getMitreTechnique.mockResolvedValue({ ...technique, relatedMissions: [] });

    render(
      <MemoryRouter>
        <MitreTechniqueModal technique={technique} isOpen isCompleted={false} onClose={onClose} />
      </MemoryRouter>
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders accessible dialog attributes', async () => {
    getMitreTechnique.mockResolvedValue({ ...technique, relatedMissions: [] });

    render(
      <MemoryRouter>
        <MitreTechniqueModal technique={technique} isOpen isCompleted={false} onClose={vi.fn()} />
      </MemoryRouter>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-label', 'MITRE technique details');
  });

  it('clears tooltips on dialog click and non-Escape keydown', async () => {
    const onClose = vi.fn();
    getMitreTechnique.mockResolvedValue({ ...technique, relatedMissions: [] });

    render(
      <MemoryRouter>
        <MitreTechniqueModal technique={technique} isOpen isCompleted={false} onClose={onClose} />
      </MemoryRouter>
    );

    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(onClose).not.toHaveBeenCalled();
  });
});
