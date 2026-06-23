import { describe, expect, it } from 'vitest';
import { getRouteParam, requireRouteParam } from './routeParams.js';

describe('routeParams', () => {
  it('returns undefined for missing param', () => {
    expect(getRouteParam(undefined)).toBeUndefined();
  });

  it('returns string param as-is', () => {
    expect(getRouteParam('ticket-1')).toBe('ticket-1');
  });

  it('returns first element from array param', () => {
    expect(getRouteParam(['ticket-1', 'extra'])).toBe('ticket-1');
  });

  it('throws when required param is missing', () => {
    expect(() => requireRouteParam(undefined)).toThrow('Missing route parameter: id');
    expect(() => requireRouteParam([])).toThrow('Missing route parameter: id');
  });

  it('returns required param with custom name in error', () => {
    expect(requireRouteParam('msg-1', 'messageId')).toBe('msg-1');
    expect(() => requireRouteParam(undefined, 'messageId')).toThrow(
      'Missing route parameter: messageId'
    );
  });
});
