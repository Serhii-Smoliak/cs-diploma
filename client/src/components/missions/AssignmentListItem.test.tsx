import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Level } from '@cybertactics/shared';
import AssignmentListItem from './AssignmentListItem';

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

const level: Level = {
  level_id: 'ghost_recon_01',
  mission_id: 'operation_ghost',
  mitre_id: 'T1598',
  mitre_technique: { id: 'T1598', name: 'Phishing for Information', tactic: 'reconnaissance' },
  title: 'Find admin email',
  order: 1,
  dialogue: [],
  task_type: 'code_editor',
  work_area: { type: 'code_editor', language: 'regex', starter_code: '' },
  validation: { type: 'regex', pattern: '.*' },
  rewards: { xp: 10, stealth_delta: 0 },
  hints: [],
};

describe('AssignmentListItem', () => {
  it('selects assignment on row click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onStart = vi.fn().mockResolvedValue(undefined);

    render(
      <AssignmentListItem
        level={level}
        index={0}
        isCompleted={false}
        isAvailable
        isSelected={false}
        isEn
        title="Find admin email"
        taskTypeLabel="Code editor"
        onSelect={onSelect}
        onStart={onStart}
      />
    );

    await user.click(screen.getByRole('button', { name: /Find admin email/i }));
    expect(onSelect).toHaveBeenCalledWith(level);
  });

  it('starts assignment from arrow button', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onStart = vi.fn().mockResolvedValue(undefined);

    render(
      <AssignmentListItem
        level={level}
        index={0}
        isCompleted={false}
        isAvailable
        isSelected={false}
        isEn
        title="Find admin email"
        taskTypeLabel="Code editor"
        onSelect={onSelect}
        onStart={onStart}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Start assignment' }));
    expect(onStart).toHaveBeenCalledWith(level);
  });

  it('shows completed status label', () => {
    render(
      <AssignmentListItem
        level={level}
        index={0}
        isCompleted
        isAvailable
        isSelected={false}
        isEn
        title="Find admin email"
        taskTypeLabel="Code editor"
        onSelect={vi.fn()}
        onStart={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText('assignmentStatusCompleted')).toBeInTheDocument();
  });
});
