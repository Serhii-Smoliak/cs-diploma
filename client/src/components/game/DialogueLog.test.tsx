import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DialogueLog from './DialogueLog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

describe('DialogueLog', () => {
  it('shows empty state', () => {
    render(<DialogueLog dialogues={[]} />);
    expect(screen.getByText('noDialogueAvailable')).toBeInTheDocument();
  });

  it('renders speakers and code blocks', () => {
    render(
      <DialogueLog
        dialogues={[
          { speaker: 'system', text: 'System alert' },
          {
            speaker: 'handler',
            text: 'Done. ```choice A```',
          },
          { speaker: 'hint', text: '[HINT]: Try regex' },
        ]}
      />
    );

    expect(screen.getByText(/System alert/)).toBeInTheDocument();
    expect(screen.getByText('choice A')).toBeInTheDocument();
    expect(screen.getByText(/Try regex/)).toBeInTheDocument();
  });
});
