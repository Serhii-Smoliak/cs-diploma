import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MissionKillChainSection from './MissionKillChainSection';

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

const killChain = {
  title: 'Cyber Kill Chain',
  intro: 'Mission tasks follow attack stages:',
  steps: ['Recon', 'Access', 'Execution'],
  expandLabel: 'Show chain',
  collapseLabel: 'Hide chain',
};

describe('MissionKillChainSection', () => {
  it('toggles expanded state', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<MissionKillChainSection killChain={killChain} isOpen={false} onToggle={onToggle} />);
    await user.click(screen.getByRole('button', { name: 'Cyber Kill Chain' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders steps when open', () => {
    render(<MissionKillChainSection killChain={killChain} isOpen onToggle={vi.fn()} />);
    expect(screen.getByText('Recon')).toBeInTheDocument();
    expect(screen.getByText('Mission tasks follow attack stages:')).toBeInTheDocument();
  });
});
