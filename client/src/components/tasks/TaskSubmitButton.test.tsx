import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskSubmitButton from './TaskSubmitButton';

describe('TaskSubmitButton', () => {
  it('calls onClick when enabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<TaskSubmitButton onClick={onClick}>Submit answer</TaskSubmitButton>);
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <TaskSubmitButton onClick={onClick} disabled>
        Submit answer
      </TaskSubmitButton>
    );
    await user.click(screen.getByRole('button', { name: 'Submit answer' }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
