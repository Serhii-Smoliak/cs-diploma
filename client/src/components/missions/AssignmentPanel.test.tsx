import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Level } from '@cybertactics/shared';
import AssignmentPanel from './AssignmentPanel';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('../mitre/MitreTechniqueChip', () => ({
  default: ({ techniqueId }: { techniqueId: string }) => <span>{techniqueId}</span>,
  ExternalLinkIcon: () => <span aria-hidden>↗</span>,
}));

const baseLevel: Level = {
  level_id: 'ghost_recon_01',
  mission_id: 'operation_ghost',
  mitre_id: 'T1598',
  mitre_technique: {
    id: 'T1598',
    name: 'Phishing for Information',
    tactic: 'reconnaissance',
    description: 'Gather info via phishing',
    url: null,
  },
  title: 'Find admin email',
  order: 1,
  dialogue: [],
  task_type: 'code_editor',
  work_area: { input_type: 'regex', placeholder: 'Enter regex pattern' },
  validation: { type: 'regex_match', correct_pattern: '.*' },
  rewards: { xp: 25, stealth_impact: -5 },
  hints: [],
};

const helpers = {
  getLevelTitle: (_id: string, fallback: string) => fallback,
  getTaskTypeLabel: () => 'Code editor',
  getTechniqueName: (_id: string, fallback: string) => fallback,
  getTacticLabel: (tactic: string) => tactic,
  getTacticExplanation: () => 'Recon explanation',
  getTechniqueDescription: (_id: string, fallback: string | null) => fallback ?? '',
};

describe('AssignmentPanel', () => {
  it('renders empty state when no level selected', () => {
    render(
      <AssignmentPanel
        isEn
        selectedLevel={null}
        selectedLevelIndex={-1}
        killChainStep={null}
        isCompleted={false}
        onStart={vi.fn().mockResolvedValue(undefined)}
        {...helpers}
      />
    );

    expect(screen.getByText('Select an assignment on the left')).toBeInTheDocument();
  });

  it('renders assignment details and starts mission', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn().mockResolvedValue(undefined);

    render(
      <AssignmentPanel
        isEn
        selectedLevel={baseLevel}
        selectedLevelIndex={0}
        killChainStep="Recon step"
        isCompleted={false}
        onStart={onStart}
        {...helpers}
      />
    );

    expect(screen.getByText('Find admin email')).toBeInTheDocument();
    expect(screen.getByText('Recon step')).toBeInTheDocument();
    expect(screen.getByText('T1598')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Start assignment/i }));
    expect(onStart).toHaveBeenCalledWith(baseLevel);
  });

  it('shows completed status for finished assignment', () => {
    render(
      <AssignmentPanel
        isEn
        selectedLevel={baseLevel}
        selectedLevelIndex={2}
        killChainStep={null}
        isCompleted
        onStart={vi.fn().mockResolvedValue(undefined)}
        {...helpers}
      />
    );

    expect(screen.getByText('assignmentStatusCompleted')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('falls back to task type when mitre technique is missing', () => {
    const levelWithoutMitre: Level = { ...baseLevel, mitre_technique: null };

    render(
      <AssignmentPanel
        isEn
        selectedLevel={levelWithoutMitre}
        selectedLevelIndex={0}
        killChainStep={null}
        isCompleted={false}
        onStart={vi.fn().mockResolvedValue(undefined)}
        {...helpers}
      />
    );

    expect(screen.getAllByText('Code editor').length).toBeGreaterThan(0);
  });
});
