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
});
