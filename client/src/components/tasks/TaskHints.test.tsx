import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TaskHints from './TaskHints';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('TaskHints', () => {
  it('returns null without hints', () => {
    const { container } = render(<TaskHints hints={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('toggles hint list', async () => {
    const user = userEvent.setup();

    render(<TaskHints hints={['Use regex', 'Check headers']} />);

    await user.click(screen.getByRole('button', { name: 'showHints' }));
    expect(screen.getByText('Use regex')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'hideHints' }));
    expect(screen.queryByText('Use regex')).not.toBeInTheDocument();
  });
});
