import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CodeEditor from './CodeEditor';
import { createTestLevel } from '../../test/fixtures';

const submitAnswer = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      submitAnswer,
    }),
}));

vi.mock('./useTaskProgress', () => ({
  preventTaskMouseDefault: vi.fn(),
  useTaskProgress: () => ({
    result: 'failure\nWrong pattern',
    isSuccess: false,
    xpGained: null,
    resetProgress: vi.fn(),
    applySubmitResponse: vi.fn(),
    applySubmitError: vi.fn(),
    hasNextLevel: () => false,
    goToNextLevel: vi.fn(),
  }),
}));

describe('CodeEditor', () => {
  it('submits regex answer', async () => {
    const user = userEvent.setup();
    submitAnswer.mockResolvedValue({ success: false, message: 'Wrong pattern' });
    const level = createTestLevel();

    render(<CodeEditor level={level} />);

    await user.type(screen.getByRole('textbox'), '.*@.*');
    await user.click(screen.getByRole('button', { name: 'execute' }));

    expect(submitAnswer).toHaveBeenCalledWith('.*@.*');
    expect(screen.getByText(/Wrong pattern/)).toBeInTheDocument();
  });
});
