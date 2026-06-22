import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FaqAccordion from './FaqAccordion';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    span: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <span {...props}>{children}</span>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const sections = [
  {
    id: 'general',
    titleKey: 'general.title',
    items: [{ id: 'what', questionKey: 'general.what.q', answerKey: 'general.what.a' }],
  },
];

describe('FaqAccordion', () => {
  it('calls onToggle when question is clicked', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<FaqAccordion sections={sections} expandedIds={new Set()} onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: 'general.what.q' }));
    expect(onToggle).toHaveBeenCalledWith('general.what');
  });

  it('shows answer when item is expanded', () => {
    render(
      <FaqAccordion
        sections={sections}
        expandedIds={new Set(['general.what'])}
        onToggle={vi.fn()}
      />
    );

    expect(screen.getByText('general.what.a')).toBeInTheDocument();
  });
});
