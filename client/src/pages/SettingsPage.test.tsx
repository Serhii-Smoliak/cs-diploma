import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authStoreState = vi.hoisted((): {
  user: { id: string; role: 'USER' | 'ADMIN' } | null;
} => ({
  user: { id: 'admin-1', role: 'ADMIN' },
}));

const refreshUserMock = vi.hoisted(() =>
  vi.fn().mockImplementation(async () => {
    // Simulates /users/me refresh; tests mutate authStoreState.user before confirm.
  })
);

const { t, i18n } = vi.hoisted(() => ({
  t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  i18n: { resolvedLanguage: 'uk' },
}));

function createAuthStoreMock() {
  const useAuthStore = (
    selector: (state: {
      user: { id: string; role: 'USER' | 'ADMIN' } | null;
      refreshUser: () => Promise<void>;
    }) => unknown
  ) =>
    selector({
      user: authStoreState.user,
      refreshUser: refreshUserMock,
    });

  useAuthStore.getState = () => ({
    user: authStoreState.user,
    refreshUser: refreshUserMock,
  });

  return useAuthStore;
}

vi.mock('../store/authStore', () => ({
  useAuthStore: createAuthStoreMock(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t, i18n }),
}));

vi.mock('../services/api', () => ({
  api: {
    getAdminUsers: vi.fn(),
    getAdminMitreStats: vi.fn(),
    setAdminUserBlocked: vi.fn(),
    syncAdminMitre: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

import { api } from '../services/api';
import SettingsPage from './SettingsPage';

describe('SettingsPage', () => {
  beforeEach(() => {
    authStoreState.user = { id: 'admin-1', role: 'ADMIN' };
    refreshUserMock.mockClear();
    vi.mocked(api.getAdminUsers).mockClear();
    vi.mocked(api.getAdminMitreStats).mockClear();
    vi.mocked(api.setAdminUserBlocked).mockClear();
    vi.mocked(api.syncAdminMitre).mockClear();
    vi.mocked(api.getCurrentUser).mockClear();
    vi.mocked(api.getCurrentUser).mockResolvedValue({
      id: 'admin-1',
      username: 'admin',
      email: 'admin@test.com',
      role: 'ADMIN',
      xp: 0,
      rank: 'Script Kiddie',
      stealth: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(api.getAdminUsers).mockResolvedValue([
      {
        id: 'user-1',
        username: 'agent',
        email: 'agent@test.com',
        role: 'USER',
        xp: 100,
        rank: 'Novice Hacker',
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(api.getAdminMitreStats).mockResolvedValue({
      totalTechniques: 846,
      uk: { full: 5, partial: 841, none: 0 },
      en: { full: 846, partial: 0, none: 0 },
    });
    vi.mocked(api.setAdminUserBlocked).mockResolvedValue({
      id: 'user-1',
      username: 'agent',
      email: 'agent@test.com',
      role: 'USER',
      xp: 100,
      rank: 'Novice Hacker',
      isBlocked: true,
      blockedAt: '2026-06-23T00:00:00.000Z',
      blockedReason: 'abuse',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(api.syncAdminMitre).mockResolvedValue({
      success: true,
      message: 'Synchronized 2 techniques',
      synced: 2,
      errors: 0,
      coverage: {
        totalTechniques: 846,
        uk: { full: 5, partial: 841, none: 0 },
        en: { full: 846, partial: 0, none: 0 },
      },
    });
  });

  it('renders users and MITRE stats', async () => {
    render(<SettingsPage />);

    expect(await screen.findByText('agent')).toBeInTheDocument();
    expect(screen.getByText('Українська (як у UI)')).toBeInTheDocument();
    expect(screen.getByText('841')).toBeInTheDocument();
  });

  it('blocks user from modal with reason', async () => {
    const userEvents = userEvent.setup();
    render(<SettingsPage />);
    await screen.findByText('agent');

    fireEvent.click(screen.getByRole('button', { name: 'Заблокувати' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await userEvents.type(
      screen.getByPlaceholderText('Опишіть, чому акаунт блокується...'),
      'abuse'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Так, заблокувати' }));

    await waitFor(() => {
      expect(api.setAdminUserBlocked).toHaveBeenCalledWith('user-1', true, 'abuse');
    });
    expect(await screen.findByText('Заблоковано')).toBeInTheDocument();
    expect(screen.getByText('abuse')).toBeInTheDocument();
  });

  it('shows confirmation before MITRE sync and re-checks admin role', async () => {
    render(<SettingsPage />);
    await screen.findByText('agent');

    fireEvent.click(screen.getByRole('button', { name: 'Синхронізувати техніки' }));
    expect(api.syncAdminMitre).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Так, синхронізувати' }));

    await waitFor(() => {
      expect(api.getCurrentUser).toHaveBeenCalled();
      expect(refreshUserMock).toHaveBeenCalled();
      expect(api.syncAdminMitre).toHaveBeenCalled();
    });
    expect(await screen.findByText('Synchronized 2 techniques')).toBeInTheDocument();
  });

  it('does not sync when admin role check fails after refresh', async () => {
    render(<SettingsPage />);
    await screen.findByText('agent');

    fireEvent.click(screen.getByRole('button', { name: 'Синхронізувати техніки' }));
    vi.mocked(api.getCurrentUser).mockResolvedValue({
      id: 'admin-1',
      username: 'user',
      email: 'user@test.com',
      role: 'USER',
      xp: 0,
      rank: 'Script Kiddie',
      stealth: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Так, синхронізувати' }));

    await waitFor(() => {
      expect(api.getCurrentUser).toHaveBeenCalled();
    });
    expect(api.syncAdminMitre).not.toHaveBeenCalled();
    expect(
      await screen.findByText('Для цієї дії потрібні права адміністратора.')
    ).toBeInTheDocument();
  });
});
