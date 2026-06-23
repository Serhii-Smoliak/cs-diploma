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

  it('loads support, notifications and news endpoints', async () => {
    api.setToken('token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url.endsWith('/support/tickets/limit')) {
          return { ok: true, json: async () => ({ limit: 3, usedToday: 1, remainingToday: 2 }) };
        }
        if (url.endsWith('/support/tickets') && method === 'GET') {
          return { ok: true, json: async () => [{ id: 'ticket-1', subject: 'Help' }] };
        }
        if (url.includes('/support/tickets/ticket-1') && method === 'GET') {
          return { ok: true, json: async () => ({ id: 'ticket-1', messages: [] }) };
        }
        if (url.endsWith('/support/tickets') && method === 'POST') {
          return { ok: true, json: async () => ({ id: 'ticket-2', subject: 'New' }) };
        }
        if (url.endsWith('/notifications/unread-count')) {
          return { ok: true, json: async () => ({ count: 2 }) };
        }
        if (url.endsWith('/notifications/read-all') && method === 'PATCH') {
          return { ok: true, json: async () => ({ success: true }) };
        }
        if (url.includes('/notifications/notif-1/read') && method === 'PATCH') {
          return { ok: true, json: async () => ({ id: 'notif-1', isRead: true }) };
        }
        if (url.endsWith('/notifications')) {
          return { ok: true, json: async () => [{ id: 'notif-1', isRead: false }] };
        }
        if (url.includes('/admin/news/news-1') && method === 'PATCH') {
          return { ok: true, json: async () => ({ id: 'news-1', titleUk: 'Updated' }) };
        }
        if (url.includes('/admin/news/news-1') && method === 'DELETE') {
          return { ok: true, json: async () => ({}) };
        }
        if (url.endsWith('/admin/news') && method === 'POST') {
          return { ok: true, json: async () => ({ id: 'news-2', titleUk: 'UA' }) };
        }
        if (url.endsWith('/admin/news') && method === 'GET') {
          return { ok: true, json: async () => [{ id: 'news-1', titleUk: 'UA' }] };
        }
        if (url.endsWith('/news/news-1')) {
          return { ok: true, json: async () => ({ id: 'news-1', title: 'News' }) };
        }
        if (url.endsWith('/news') && !url.includes('/admin/')) {
          return { ok: true, json: async () => [{ id: 'news-1', title: 'News' }] };
        }
        if (url.endsWith('/admin/mitre/stats')) {
          return {
            ok: true,
            json: async () => ({ totalTechniques: 2, uk: { full: 1, partial: 1, none: 0 } }),
          };
        }
        if (url.endsWith('/admin/mitre/sync') && method === 'POST') {
          return {
            ok: true,
            json: async () => ({
              success: true,
              message: 'Synchronized 2 techniques',
              synced: 2,
              errors: 0,
              coverage: { totalTechniques: 2 },
            }),
          };
        }
        if (url.endsWith('/admin/support/tickets')) {
          return { ok: true, json: async () => [{ id: 'ticket-1' }] };
        }
        if (url.includes('/admin/support/tickets/ticket-1') && method === 'GET') {
          return { ok: true, json: async () => ({ id: 'ticket-1', messages: [] }) };
        }
        if (url.includes('/admin/support/tickets/ticket-1/close') && method === 'POST') {
          return { ok: true, json: async () => ({ id: 'ticket-1', status: 'CLOSED' }) };
        }
        if (url.includes('/admin/support/tickets/ticket-1/reply') && method === 'POST') {
          return { ok: true, json: async () => ({ id: 'msg-1', isStaffReply: true }) };
        }
        if (url.includes('/admin/support/messages/msg-1') && method === 'PATCH') {
          return { ok: true, json: async () => ({ id: 'msg-1', body: 'Updated' }) };
        }
        if (url.includes('/admin/support/messages/msg-1') && method === 'DELETE') {
          return { ok: true, json: async () => ({}) };
        }
        if (url.endsWith('/admin/users')) {
          return { ok: true, json: async () => [{ id: 'user-1' }] };
        }
        if (url.includes('/admin/users/user-1/block') && method === 'PATCH') {
          return { ok: true, json: async () => ({ id: 'user-1', isBlocked: true }) };
        }
        return { ok: true, json: async () => ({}) };
      })
    );

    await expect(api.getSupportTicketLimit()).resolves.toMatchObject({ remainingToday: 2 });
    await expect(api.getSupportTickets()).resolves.toHaveLength(1);
    await expect(api.getSupportTicket('ticket-1')).resolves.toMatchObject({ id: 'ticket-1' });
    await expect(api.createSupportTicket('Help', 'Need assistance now')).resolves.toMatchObject({
      id: 'ticket-2',
    });
    await expect(api.getNotifications()).resolves.toHaveLength(1);
    await expect(api.getNotificationUnreadCount()).resolves.toEqual({ count: 2 });
    await expect(api.markNotificationRead('notif-1')).resolves.toMatchObject({ isRead: true });
    await expect(api.markAllNotificationsRead()).resolves.toEqual({ success: true });
    await expect(api.getNewsPosts()).resolves.toHaveLength(1);
    await expect(api.getNewsPost('news-1')).resolves.toMatchObject({ id: 'news-1' });
    await expect(api.getAdminNewsPosts()).resolves.toHaveLength(1);
    await expect(
      api.createAdminNewsPost({
        titleUk: 'UA',
        titleEn: 'EN',
        bodyUk: 'Body UA',
        bodyEn: 'Body EN',
      })
    ).resolves.toMatchObject({ id: 'news-2' });
    await expect(api.updateAdminNewsPost('news-1', { titleUk: 'Updated' })).resolves.toMatchObject({
      titleUk: 'Updated',
    });
    await expect(api.deleteAdminNewsPost('news-1')).resolves.toBeUndefined();
    await expect(api.getAdminMitreStats()).resolves.toMatchObject({ totalTechniques: 2 });
    await expect(api.syncAdminMitre()).resolves.toMatchObject({ success: true, synced: 2 });
    await expect(api.getAdminSupportTickets()).resolves.toHaveLength(1);
    await expect(api.getAdminSupportTicket('ticket-1')).resolves.toMatchObject({ id: 'ticket-1' });
    await expect(api.replyAdminSupportTicket('ticket-1', 'Reply')).resolves.toMatchObject({
      isStaffReply: true,
    });
    await expect(api.closeAdminSupportTicket('ticket-1', 'DECLINED')).resolves.toMatchObject({
      status: 'CLOSED',
    });
    await expect(api.updateAdminSupportMessage('msg-1', 'Updated')).resolves.toMatchObject({
      body: 'Updated',
    });
    await expect(api.deleteAdminSupportMessage('msg-1')).resolves.toBeUndefined();
    await expect(api.getAdminUsers()).resolves.toHaveLength(1);
    await expect(api.setAdminUserBlocked('user-1', true, 'abuse')).resolves.toMatchObject({
      isBlocked: true,
    });
  });
});
