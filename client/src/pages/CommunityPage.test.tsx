import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const { t, i18n } = vi.hoisted(() => ({
  t: (key: string) => key,
  i18n: { resolvedLanguage: 'en', language: 'en' },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
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

import CommunityPage from './CommunityPage';

describe('CommunityPage', () => {
  it('filters topics by category', async () => {
    const user = userEvent.setup();

    render(<CommunityPage />);

    expect(screen.getAllByText('topics.welcome.title').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'categories.missions' }));
    expect(screen.getAllByText('topics.ghostStart.title').length).toBeGreaterThan(0);
    expect(screen.queryAllByText('topics.welcome.title')).toHaveLength(0);
  });
});
