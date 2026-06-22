import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LevelTransition from './LevelTransition';
import { createTestLevel } from '../../test/fixtures';

vi.mock('@/store/gameStore.ts', () => ({
  useGameStore: () => ({ currentLevel: createTestLevel() }),
}));

describe('LevelTransition', () => {
  it('shows transition overlay with next level title', () => {
    render(<LevelTransition show message="Loading next task" />);

    expect(screen.getByText('Loading next task')).toBeInTheDocument();
    expect(screen.getByText(/Find admin email/)).toBeInTheDocument();
  });

  it('hides overlay when show is false', () => {
    render(<LevelTransition show={false} message="Hidden" />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });
});
