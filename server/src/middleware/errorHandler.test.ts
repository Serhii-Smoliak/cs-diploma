import { describe, expect, it, vi } from 'vitest';
import { apiErrorHandler, apiNotFoundHandler } from './errorHandler';

describe('errorHandler', () => {
  it('returns 404 for unknown routes', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    apiNotFoundHandler({} as never, { status } as never);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  it('returns 400 for invalid json body', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const err = new SyntaxError('Unexpected token');
    Object.assign(err, { body: '{}' });

    apiErrorHandler(
      err,
      { method: 'POST', path: '/api/test' } as never,
      {
        headersSent: false,
        status,
      } as never,
      vi.fn()
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'Invalid request' });
  });

  it('returns 500 for unhandled errors', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));

    apiErrorHandler(
      new Error('boom'),
      { method: 'GET', path: '/api/test' } as never,
      {
        headersSent: false,
        status,
      } as never,
      vi.fn()
    );

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });
});
