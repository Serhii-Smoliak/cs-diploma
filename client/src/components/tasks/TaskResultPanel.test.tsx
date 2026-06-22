import type { TFunction } from 'i18next';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskResultPanel from './TaskResultPanel';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

describe('TaskResultPanel', () => {
  const t = ((key: string) => key) as TFunction;

  it('renders success state with next level button', async () => {
    const user = userEvent.setup();
    const onNextLevel = vi.fn();

    render(
      <TaskResultPanel
        result="Task done"
        isSuccess
        xpGained={25}
        hasNextLevel
        onNextLevel={onNextLevel}
        t={t}
      />
    );

    expect(screen.getByText('successTitle')).toBeInTheDocument();
    expect(screen.getByText('+25 XP')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /nextLevel/i }));
    expect(onNextLevel).toHaveBeenCalled();
  });

  it('renders compact failure layout', () => {
    render(
      <TaskResultPanel
        result="Wrong answer"
        isSuccess={false}
        xpGained={null}
        hasNextLevel={false}
        onNextLevel={vi.fn()}
        t={t}
        layout="compact"
      />
    );

    expect(screen.getByText('Wrong answer')).toBeInTheDocument();
  });

  it('shows all completed message when success without next level', () => {
    render(
      <TaskResultPanel
        result="Done"
        isSuccess
        xpGained={10}
        hasNextLevel={false}
        onNextLevel={vi.fn()}
        t={t}
      />
    );

    expect(screen.getByText('allCompleted')).toBeInTheDocument();
  });
});
