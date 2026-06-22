import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SentenceConstructor from './SentenceConstructor';
import { createTestLevel } from '../../test/fixtures';

const submitAnswer = vi.fn();

const { resetProgress, applySubmitResponse, applySubmitError } = vi.hoisted(() => ({
  resetProgress: vi.fn(),
  applySubmitResponse: vi.fn(),
  applySubmitError: vi.fn(),
}));

const sentenceLevel = createTestLevel({
  level_id: 'ghost_sentence_01',
  task_type: 'sentence_constructor',
  work_area: {
    email_to: 'admin@target.test',
    fields: [
      {
        id: 'cmd',
        label: 'Command',
        slots: 1,
        tokens: [{ id: 't1', text: 'part_a' }],
      },
    ],
    attachments: [{ id: 'lnk1', name: 'invoice.lnk', type: 'lnk', allowed: true }],
  },
});

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

describe('SentenceConstructor', () => {
  it('submits built sentence with attachment', async () => {
    const user = userEvent.setup();
    submitAnswer.mockResolvedValue({ success: true, message: 'OK', xpGained: 40 });

    render(<SentenceConstructor level={sentenceLevel} />);

    await user.click(screen.getByRole('button', { name: 'part_a' }));
    await user.click(screen.getByRole('button', { name: /invoice\.lnk/i }));
    await user.click(screen.getByRole('button', { name: 'sendEmail' }));

    await waitFor(() => {
      expect(submitAnswer).toHaveBeenCalledWith({
        to: 'admin@target.test',
        fields: { cmd: ['t1'] },
        attachments: ['lnk1'],
      });
    });
  });

  it('uses default labels for subject and body fields', () => {
    const labeledLevel = createTestLevel({
      level_id: 'ghost_sentence_02',
      task_type: 'sentence_constructor',
      work_area: {
        email_to: 'admin@target.test',
        fields: [
          { id: 'subject', slots: 1, tokens: [{ id: 't1', text: 'subject_token' }] },
          { id: 'body', slots: 1, tokens: [{ id: 't2', text: 'body_token' }] },
        ],
        attachments: [{ id: 'lnk1', name: 'invoice.lnk', type: 'lnk', allowed: true }],
      },
    });

    render(<SentenceConstructor level={labeledLevel} />);

    expect(screen.getByText('emailSubject')).toBeInTheDocument();
    expect(screen.getByText('emailBody')).toBeInTheDocument();
  });

  it('removes selected token from a slot', async () => {
    const user = userEvent.setup();

    render(<SentenceConstructor level={sentenceLevel} />);

    await user.click(screen.getByRole('button', { name: 'part_a' }));
    await user.click(screen.getByRole('button', { name: 'part_a' }));

    expect(screen.getByRole('button', { name: 'part_a' })).toBeInTheDocument();
  });

  it('handles submit errors', async () => {
    const user = userEvent.setup();
    submitAnswer.mockRejectedValueOnce(new Error('submit failed'));

    render(<SentenceConstructor level={sentenceLevel} />);

    await user.click(screen.getByRole('button', { name: 'part_a' }));
    await user.click(screen.getByRole('button', { name: /invoice\.lnk/i }));
    await user.click(screen.getByRole('button', { name: 'sendEmail' }));

    await waitFor(() => {
      expect(applySubmitError).toHaveBeenCalled();
    });
  });
});
