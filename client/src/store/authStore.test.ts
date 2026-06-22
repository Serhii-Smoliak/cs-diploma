import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@cybertactics/shared';

const { login, register, clearToken, getToken, getCurrentUser } = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  clearToken: vi.fn(),
  getToken: vi.fn(),
  getCurrentUser: vi.fn(),
}));

vi.mock('zustand/middleware', async () => {
  const actual = await vi.importActual<typeof import('zustand/middleware')>('zustand/middleware');
  return {
    ...actual,
    persist: ((initializer: unknown) => initializer) as typeof actual.persist,
  };
});

vi.mock('../services/api', () => ({
  api: {
    login,
    register,
    clearToken,
    getToken,
    getCurrentUser,
  },
}));

vi.mock('../i18n/applyLocale', () => ({
  applyLocale: vi.fn().mockResolvedValue(undefined),
}));

const registerSessionExpiredHandler = vi.hoisted(() => vi.fn());

vi.mock('../auth/sessionExpired', () => ({
  registerSessionExpiredHandler,
  resetSessionExpiredGuard: vi.fn(),
}));

import { applyLocale } from '../i18n/applyLocale';
import { useAuthStore } from './authStore';

const mockUser: User = {
  id: 'u1',
  username: 'agent',
  email: 'agent@test.com',
  xp: 100,
  rank: 'Novice Hacker',
  stealth: 80,
  preferredLocale: 'en',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    login.mockReset();
    register.mockReset();
    clearToken.mockReset();
    getToken.mockReset();
    getCurrentUser.mockReset();
    vi.mocked(applyLocale).mockClear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('logs in and stores user', async () => {
    login.mockResolvedValue({ user: mockUser });

    await useAuthStore.getState().login('agent@test.com', 'pass');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('logs out and clears token', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    useAuthStore.getState().logout();

    expect(clearToken).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('merges partial user updates', () => {
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    useAuthStore.getState().updateUser({ xp: 200, rank: 'Advanced Hacker' });

    expect(useAuthStore.getState().user?.xp).toBe(200);
    expect(useAuthStore.getState().user?.email).toBe('agent@test.com');
  });

  it('refreshes user profile when token exists', async () => {
    getToken.mockReturnValue('token');
    getCurrentUser.mockResolvedValue({ ...mockUser, xp: 300 });
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    await useAuthStore.getState().refreshUser();

    expect(useAuthStore.getState().user?.xp).toBe(300);
  });

  it('registers user and stores session', async () => {
    register.mockResolvedValue({ user: mockUser });

    await useAuthStore.getState().register('agent', 'agent@test.com', 'secret12');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('logs out when refreshUser called without token', async () => {
    getToken.mockReturnValue(null);
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    await useAuthStore.getState().refreshUser();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('ignores refreshUser errors', async () => {
    getToken.mockReturnValue('token');
    getCurrentUser.mockRejectedValue(new Error('network'));
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    await useAuthStore.getState().refreshUser();

    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('syncs locale after login when user has preferred locale', async () => {
    login.mockResolvedValue({ user: mockUser });

    await useAuthStore.getState().login('agent@test.com', 'pass');

    expect(applyLocale).toHaveBeenCalledWith('en');
  });

  it('skips locale sync when user has no preferred locale', async () => {
    login.mockResolvedValue({ user: { ...mockUser, preferredLocale: undefined } });

    await useAuthStore.getState().login('agent@test.com', 'pass');

    expect(applyLocale).not.toHaveBeenCalled();
  });

  it('ignores updateUser when user is absent', () => {
    useAuthStore.getState().updateUser({ xp: 999 });

    expect(useAuthStore.getState().user).toBeNull();
  });

  it('logs out when session expired handler fires', () => {
    const calls = registerSessionExpiredHandler.mock.calls;
    const handler = calls[calls.length - 1]?.[0] as (() => void) | undefined;
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    handler?.();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
