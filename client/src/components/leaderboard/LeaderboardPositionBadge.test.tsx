import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LeaderboardPositionBadge from './LeaderboardPositionBadge';

describe('LeaderboardPositionBadge', () => {
  it('renders medal for top three positions', () => {
    render(<LeaderboardPositionBadge position={1} />);
    expect(screen.getByText('🥇')).toBeInTheDocument();

    render(<LeaderboardPositionBadge position={2} />);
    expect(screen.getByText('🥈')).toBeInTheDocument();

    render(<LeaderboardPositionBadge position={3} />);
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('renders numeric rank badge for fourth place and below', () => {
    render(<LeaderboardPositionBadge position={4} />);
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByLabelText('#4')).toBeInTheDocument();

    render(<LeaderboardPositionBadge position={6} />);
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByLabelText('#6')).toBeInTheDocument();

    render(<LeaderboardPositionBadge position={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
