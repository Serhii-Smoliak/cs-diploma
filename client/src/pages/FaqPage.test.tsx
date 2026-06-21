import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { t, i18n } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'en', language: 'en' },
}));

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
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../i18n/config', () => ({
  loadMultipleNamespaces: vi.fn().mockResolvedValue(undefined),
}));

import FaqPage from './FaqPage';

describe('FaqPage', () => {
  it('renders faq title and toggles accordion item', async () => {
    const user = userEvent.setup();

    render(<FaqPage />);

    expect(screen.getByText('FAQ')).toBeInTheDocument();

    const question = screen.getByRole('button', { name: 'items.whatIs.question' });
    await user.click(question);
    expect(screen.getByText('items.whatIs.answer')).toBeInTheDocument();
  });
});
