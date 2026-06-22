import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api, resolveAssetUrl } from './api';
import { handleSessionExpired } from '../auth/sessionExpired';

vi.mock('../auth/sessionExpired', () => ({
  handleSessionExpired: vi.fn(),
}));

vi.mock('../config/apiOrigin', () => ({
  getApiOrigin: () => 'http://localhost:4000',
  getApiBase: () => 'http://localhost:4000/api',
}));

describe('resolveAssetUrl', () => {
  it('returns undefined for empty url', () => {
    expect(resolveAssetUrl(null)).toBeUndefined();
    expect(resolveAssetUrl(undefined)).toBeUndefined();
  });

  it('returns absolute urls unchanged', () => {
    expect(resolveAssetUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(resolveAssetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  });

  it('prefixes relative paths with api origin', () => {
    expect(resolveAssetUrl('/uploads/avatar.png')).toBe('http://localhost:4000/uploads/avatar.png');
    expect(resolveAssetUrl('uploads/avatar.png')).toBe('http://localhost:4000/uploads/avatar.png');
  });
});

describe('ApiError', () => {
  it('stores status and body', () => {
    const error = new ApiError('Unauthorized', 401, { error: 'Unauthorized' });
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Unauthorized');
    expect(error.status).toBe(401);
    expect(error.body).toEqual({ error: 'Unauthorized' });
  });
});

describe('api client', () => {
  beforeEach(() => {
    api.clearToken();
    vi.mocked(handleSessionExpired).mockClear();
  });

  it('persists token in localStorage', () => {
    api.setToken('test-token');
    expect(api.getToken()).toBe('test-token');
    expect(localStorage.getItem('auth_token')).toBe('test-token');

    api.clearToken();
    expect(api.getToken()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('loads token from localStorage on first getToken call', () => {
    localStorage.setItem('auth_token', 'stored-token');
    expect(api.getToken()).toBe('stored-token');
  });

  it('returns missions on successful request', async () => {
    const missions = [{ id: 'operation_ghost', name: 'Ghost' }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => missions,
      })
    );

    await expect(api.getMissions()).resolves.toEqual(missions);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/missions',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it('throws ApiError on failed request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Bad request' }),
      })
    );

    await expect(api.getMissions()).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Bad request',
      status: 400,
    });
  });

  it('handles session expiry on authenticated 401', async () => {
    api.setToken('expired-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
    );

    await expect(api.getUserProgress()).rejects.toBeInstanceOf(ApiError);
    expect(handleSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not trigger session expiry for auth endpoints', async () => {
    api.setToken('bad-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      })
    );

    await expect(api.login('a@b.c', 'pass')).rejects.toBeInstanceOf(ApiError);
    expect(handleSessionExpired).not.toHaveBeenCalled();
  });

  it('encodes level id when submitting answer', async () => {
    api.setToken('token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ correct: true, xp: 10 }),
      })
    );

    await api.submitAnswer('iron/code 01', 'answer');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/levels/iron%2Fcode%2001/submit',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('loads leaderboard entries', async () => {
    const entries = [{ position: 1, userId: 'u1', username: 'agent', xp: 100 }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => entries,
      })
    );

    await expect(api.getLeaderboard()).resolves.toEqual(entries);
  });

  it('loads current user profile', async () => {
    api.setToken('token');
    const user = { id: 'u1', username: 'agent', email: 'a@b.c' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => user,
      })
    );

    await expect(api.getCurrentUser()).resolves.toEqual(user);
  });

  it('updates preferred locale', async () => {
    api.setToken('token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'u1', preferredLocale: 'uk' }),
      })
    );

    await api.updatePreferredLocale('uk');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:4000/api/users/me/locale',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ locale: 'uk' }),
      })
    );
  });

  it('loads translations by namespaces', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ui: { title: 'CyberTactics' } }),
      })
    );

    await expect(api.getTranslationsByNamespaces(['ui'], 'uk')).resolves.toEqual({
      ui: { title: 'CyberTactics' },
    });
  });

  it('loads stealth recovery endpoints and mitre data', async () => {
    api.setToken('token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes('/stealth/masking')) {
          return { ok: true, json: async () => ({ stealth: 30, message: 'Masked' }) };
        }
        if (url.includes('/stealth/wait')) {
          return { ok: true, json: async () => ({ stealth: 15, message: 'Recovered' }) };
        }
        if (url.includes('/mitre/techniques/T1593')) {
          return {
            ok: true,
            json: async () => ({ id: 'T1593', name: 'Search', relatedMissions: [] }),
          };
        }
        if (url.includes('/mitre/techniques')) {
          return { ok: true, json: async () => [{ id: 'T1593', name: 'Search' }] };
        }
        if (url.includes('/translations/languages')) {
          return {
            ok: true,
            json: async () => [{ code: 'uk', name: 'Ukrainian', flag: '🇺🇦', isActive: true }],
          };
        }
        if (url.includes('/translations?locale=en')) {
          return { ok: true, json: async () => ({ hello: 'Hello' }) };
        }
        return { ok: true, json: async () => ({}) };
      })
    );

    await expect(api.purchaseStealthMasking()).resolves.toEqual({
      stealth: 30,
      message: 'Masked',
    });
    await expect(api.waitForStealthRecovery()).resolves.toEqual({
      stealth: 15,
      message: 'Recovered',
    });
    await expect(api.getMitreTechniques()).resolves.toEqual([{ id: 'T1593', name: 'Search' }]);
    await expect(api.getMitreTechnique('T1593')).resolves.toMatchObject({ id: 'T1593' });
    await expect(api.getLanguages()).resolves.toEqual([
      { code: 'uk', name: 'Ukrainian', flag: '🇺🇦', isActive: true },
    ]);
    await expect(api.getTranslations('en', 'common')).resolves.toEqual({ hello: 'Hello' });
  });
});
