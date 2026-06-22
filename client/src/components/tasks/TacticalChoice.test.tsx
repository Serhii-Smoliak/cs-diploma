import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TacticalChoice from './TacticalChoice';
import { tacticalLevel } from '../../test/fixtures';

const submitAnswer = vi.fn();

const { resetProgress, applySubmitResponse, applySubmitError, goToNextLevel } = vi.hoisted(() => ({
  resetProgress: vi.fn(),
  applySubmitResponse: vi.fn((_response: unknown, _t: unknown, onSuccess?: () => void) =>
    onSuccess?.()
  ),
  applySubmitError: vi.fn(),
  goToNextLevel: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: () => ({
    submitAnswer,
    isLoading: false,
  }),
}));

vi.mock('./useTaskProgress', () => ({
  preventTaskMouseDefault: vi.fn(),
  useTaskProgress: () => ({
    result: null,
    isSuccess: false,
    xpGained: null,
    resetProgress,
    applySubmitResponse,
    applySubmitError,
    hasNextLevel: () => false,
    goToNextLevel,
  }),
}));

describe('TacticalChoice', () => {
  it('submits selected choice', async () => {
    const user = userEvent.setup();
    submitAnswer.mockResolvedValue({
      success: true,
      message: 'Correct',
      xpGained: 25,
    });

    render(<TacticalChoice level={tacticalLevel} />);

    await user.click(screen.getAllByRole('radio')[0]!);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'execute' })).not.toBeDisabled();
    });

    await user.click(screen.getByRole('button', { name: 'execute' }));

    await waitFor(() => {
      expect(submitAnswer).toHaveBeenCalledWith('choice_1');
    });
  });
});
