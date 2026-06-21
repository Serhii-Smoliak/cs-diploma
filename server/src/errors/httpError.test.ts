import { describe, expect, it } from 'vitest';
import { HttpError } from './httpError';

describe('HttpError', () => {
  it('stores status code and message', () => {
    const error = new HttpError(401, 'Unauthorized');
    expect(error.name).toBe('HttpError');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });
});
