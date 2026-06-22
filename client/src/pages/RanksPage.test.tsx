import { render, screen, waitFor } from '@testing-library/react';
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
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../i18n/config', () => ({
  loadMultipleNamespaces: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../store/authStore', () => ({
  useAuthStore: (selector: (state: { user: { xp: number } | null }) => unknown) =>
    selector({ user: { xp: 150 } }),
}));

import RanksPage from './RanksPage';

describe('RanksPage', () => {
  it('renders rank tiers for current user xp', async () => {
    render(<RanksPage />);

    await waitFor(() => {
      expect(screen.getByText('Script Kiddie')).toBeInTheDocument();
    });

    expect(screen.getByText('Novice Hacker')).toBeInTheDocument();
    expect(screen.getByText('0–499 XP')).toBeInTheDocument();
  });
});
