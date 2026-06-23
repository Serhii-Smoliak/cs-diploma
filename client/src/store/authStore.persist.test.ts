import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@cybertactics/shared';

vi.mock('../services/api', () => ({
  api: {
    login: vi.fn(),
    register: vi.fn(),
    clearToken: vi.fn(),
    getToken: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

vi.mock('../i18n/applyLocale', () => ({
  applyLocale: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../auth/sessionExpired', () => ({
  registerSessionExpiredHandler: vi.fn(),
  resetSessionExpiredGuard: vi.fn(),
}));

const mockUser: User = {
  id: 'u1',
  username: 'agent',
  email: 'agent@test.com',
  role: 'USER',
  xp: 100,
  rank: 'Novice Hacker',
  stealth: 80,
  preferredLocale: 'en',
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useAuthStore persistence', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('persists only user and authentication flag', async () => {
    const { useAuthStore } = await import('./authStore');

    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    const stored = JSON.parse(localStorage.getItem('cybertactics-auth') ?? '{}') as {
      state?: { user?: User; isAuthenticated?: boolean; login?: unknown };
    };

    expect(stored.state).toEqual({
      user: mockUser,
      isAuthenticated: true,
    });
    expect(stored.state?.login).toBeUndefined();
  });
});
