import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LeaderboardEntry } from '@cybertactics/shared';

const { t, i18n } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'en' },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../i18n/config', () => ({
  loadMultipleNamespaces: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../components/profile/UserAvatar', () => ({
  default: ({ username }: { username: string }) => <span>{username}</span>,
}));

vi.mock('../components/leaderboard/LeaderboardPositionBadge', () => ({
  default: ({ position }: { position: number }) => <span>#{position}</span>,
}));

vi.mock('../config/apiOrigin', () => ({
  getApiOrigin: () => 'http://localhost:4000',
  getApiBase: () => 'http://localhost:4000/api',
}));

const entries: LeaderboardEntry[] = [
  {
    position: 1,
    userId: 'u1',
    username: 'phantom',
    avatarUrl: null,
    xp: 5200,
    rank: 'Elite Hacker',
    completedLevels: 5,
    mitreTechniquesCount: 5,
    isCurrentUser: true,
  },
];

import LeaderboardPage from './LeaderboardPage';

describe('LeaderboardPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => entries,
      })
    );
  });

  it('loads and renders leaderboard entries', async () => {
    render(<LeaderboardPage />);

    await screen.findByText('#1');
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    expect(screen.getByText('(you)')).toBeInTheDocument();
  });
});
