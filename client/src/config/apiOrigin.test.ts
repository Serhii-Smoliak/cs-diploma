import { describe, expect, it, vi } from 'vitest';

describe('apiOrigin', () => {
  it('uses VITE_API_ORIGIN when provided', async () => {
    vi.stubEnv('VITE_API_ORIGIN', 'http://api.test');
    vi.stubEnv('VITE_API_URL', '');
    vi.resetModules();

    const { getApiOrigin, getApiBase } = await import('./apiOrigin');
    expect(getApiOrigin()).toBe('http://api.test');
    expect(getApiBase()).toBe('http://api.test/api');
  });

  it('derives origin from VITE_API_URL', async () => {
    vi.stubEnv('VITE_API_ORIGIN', '');
    vi.stubEnv('VITE_API_URL', 'http://backend.test/api/');
    vi.resetModules();

    const { getApiOrigin, getApiBase } = await import('./apiOrigin');
    expect(getApiOrigin()).toBe('http://backend.test');
    expect(getApiBase()).toBe('http://backend.test/api');
  });

  it('falls back to relative /api when env is empty', async () => {
    vi.stubEnv('VITE_API_ORIGIN', '');
    vi.stubEnv('VITE_API_URL', '');
    vi.resetModules();

    const { getApiOrigin, getApiBase } = await import('./apiOrigin');
    expect(getApiOrigin()).toBe('');
    expect(getApiBase()).toBe('/api');
  });
});
