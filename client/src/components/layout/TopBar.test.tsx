import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TopBar from './TopBar';

const { openStealthModal, setStealthNotice } = vi.hoisted(() => ({
  openStealthModal: vi.fn(),
  setStealthNotice: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}));

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      user: {
        username: 'agent',
        xp: 250,
        rank: 'Novice Hacker',
        stealth: 15,
        avatarUrl: null,
      },
      isAuthenticated: true,
    };
    return selector ? selector(state) : state;
  },
}));

vi.mock('../../store/gameStore', () => ({
  useGameStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      stealthNotice: 'Low stealth warning',
      setStealthNotice,
      openStealthModal,
    }),
}));

vi.mock('../../store/sidebarStore', () => ({
  useSidebarStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ openMobile: vi.fn() }),
}));

vi.mock('./LanguageSwitcher', () => ({
  default: () => <div>language-switcher</div>,
}));

vi.mock('./NotificationsBell', () => ({
  default: () => <div>notifications-bell</div>,
}));

vi.mock('../profile/UserAvatar', () => ({
  default: ({ username }: { username?: string }) => <span>{username}</span>,
}));

describe('TopBar', () => {
  it('renders stealth bar, notice and profile link', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TopBar />
      </MemoryRouter>
    );

    expect(screen.getByText('15%')).toBeInTheDocument();
    expect(screen.getByText('Low stealth warning')).toBeInTheDocument();
    expect(screen.getByText('notifications-bell')).toBeInTheDocument();
    expect(screen.getByText('language-switcher')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'agent' })).toHaveAttribute('href', '/profile');

    await user.click(screen.getByLabelText('Open stealth recovery options'));
    expect(openStealthModal).toHaveBeenCalled();

    await user.click(screen.getByLabelText('close'));
    expect(setStealthNotice).toHaveBeenCalledWith(null);
  });
});
