import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CodeEditor from './CodeEditor';
import { createTestLevel } from '../../test/fixtures';

const submitAnswer = vi.fn();
const taskProgress = vi.hoisted(() => ({
  result: 'failure\nWrong pattern',
  isSuccess: false,
  xpGained: null as number | null,
  resetProgress: vi.fn(),
  applySubmitResponse: vi.fn(),
  applySubmitError: vi.fn(),
  hasNextLevel: vi.fn(() => false),
  goToNextLevel: vi.fn(),
}));

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange?: (value: string) => void;
  }) => (
    <textarea
      aria-label="code-editor"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

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
  useTaskProgress: () => taskProgress,
}));

describe('CodeEditor', () => {
  it('submits regex answer', async () => {
    const user = userEvent.setup();
    submitAnswer.mockResolvedValue({ success: false, message: 'Wrong pattern' });
    taskProgress.result = 'failure\nWrong pattern';
    taskProgress.isSuccess = false;
    taskProgress.xpGained = null;
    const level = createTestLevel();

    render(<CodeEditor level={level} />);

    await user.type(screen.getByRole('textbox'), '.*@.*');
    await user.click(screen.getByRole('button', { name: 'execute' }));

    expect(submitAnswer).toHaveBeenCalledWith('.*@.*');
    expect(screen.getByText(/Wrong pattern/)).toBeInTheDocument();
  });

  it('submits regex on Enter and renders read-only snippet', async () => {
    const user = userEvent.setup();
    submitAnswer.mockResolvedValue({ success: true, message: 'success\nDone', xpGained: 25 });
    taskProgress.result = 'success\nDone';
    taskProgress.isSuccess = true;
    taskProgress.xpGained = 25;
    taskProgress.hasNextLevel.mockReturnValue(true);

    const level = createTestLevel({
      work_area: {
        input_type: 'regex',
        placeholder: 'pattern',
        code_snippet: '<html></html>',
      },
    });

    render(<CodeEditor level={level} />);

    expect(screen.getByLabelText('code-editor')).toHaveValue('<html></html>');

    const input = screen.getByPlaceholderText('pattern');
    await user.type(input, 'abc');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(submitAnswer).toHaveBeenCalledWith('abc');
    expect(screen.getByText('successTitle')).toBeInTheDocument();
    expect(screen.getByText('+25 XP')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nextLevel/i })).toBeInTheDocument();
  });

  it('submits code task through monaco editor', async () => {
    const user = userEvent.setup();
    submitAnswer.mockResolvedValue({ success: false, message: 'error\nBad code' });
    taskProgress.result = 'error\nBad code';
    taskProgress.isSuccess = false;
    taskProgress.xpGained = null;

    const level = createTestLevel({
      work_area: { input_type: 'code', placeholder: 'Enter code' },
    });

    render(<CodeEditor level={level} />);

    await user.type(screen.getByLabelText('code-editor'), 'console.log(1)');
    await user.click(screen.getByRole('button', { name: 'execute' }));

    expect(submitAnswer).toHaveBeenCalledWith('console.log(1)');
    expect(screen.getByText(/Bad code/)).toBeInTheDocument();
  });
});
