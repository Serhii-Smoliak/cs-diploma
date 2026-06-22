import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PhishingConstructor from './PhishingConstructor';
import { phishingLevel } from '../../test/fixtures';

const submitAnswer = vi.fn();

const { resetProgress, applySubmitResponse, applySubmitError } = vi.hoisted(() => ({
  resetProgress: vi.fn(),
  applySubmitResponse: vi.fn(),
  applySubmitError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = { submitAnswer, isLoading: false };
    return selector ? selector(state) : state;
  },
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
    goToNextLevel: vi.fn(),
  }),
}));

describe('PhishingConstructor', () => {
  it('submits composed email', async () => {
    const user = userEvent.setup();
    submitAnswer.mockResolvedValue({ success: true, message: 'Sent', xpGained: 50 });

    render(<PhishingConstructor level={phishingLevel} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[1]!, 'Urgent action required');
    await user.type(inputs[2]!, 'Please review the attached report');

    await user.click(screen.getByRole('button', { name: 'sendEmail' }));

    await waitFor(() => {
      expect(submitAnswer).toHaveBeenCalledWith({
        to: 'admin@target.test',
        subject: 'Urgent action required',
        body: 'Please review the attached report',
        attachments: [],
      });
    });
  });

  it('handles submit errors', async () => {
    const user = userEvent.setup();
    submitAnswer.mockRejectedValueOnce(new Error('send failed'));

    render(<PhishingConstructor level={phishingLevel} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[1]!, 'Subject');
    await user.type(inputs[2]!, 'Body');
    await user.click(screen.getByRole('button', { name: 'sendEmail' }));

    await waitFor(() => {
      expect(applySubmitError).toHaveBeenCalled();
    });
  });
});
