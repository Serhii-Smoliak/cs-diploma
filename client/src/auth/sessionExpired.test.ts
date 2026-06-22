import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('sessionExpired', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('calls registered handlers once and redirects to login', async () => {
    const { registerSessionExpiredHandler, handleSessionExpired } =
      await import('./sessionExpired');
    const handler = vi.fn();
    registerSessionExpiredHandler(handler);

    handleSessionExpired();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(globalThis.location.assign).toHaveBeenCalledWith('/login');
  });

  it('ignores duplicate handleSessionExpired calls', async () => {
    const { registerSessionExpiredHandler, handleSessionExpired } =
      await import('./sessionExpired');
    const handler = vi.fn();
    registerSessionExpiredHandler(handler);

    handleSessionExpired();
    handleSessionExpired();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(globalThis.location.assign).toHaveBeenCalledTimes(1);
  });

  it('allows a new session expiry after guard reset', async () => {
    const { registerSessionExpiredHandler, handleSessionExpired, resetSessionExpiredGuard } =
      await import('./sessionExpired');
    const handler = vi.fn();
    registerSessionExpiredHandler(handler);

    handleSessionExpired();
    resetSessionExpiredGuard();
    handleSessionExpired();

    expect(handler).toHaveBeenCalledTimes(2);
    expect(globalThis.location.assign).toHaveBeenCalledTimes(2);
  });
});
