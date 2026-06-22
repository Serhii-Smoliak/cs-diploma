import { describe, expect, it, vi } from 'vitest';
import {
  containsUnsafePathPayload,
  handleTranslationParamError,
  parseTranslationBulkItems,
  parseTranslationKey,
  parseTranslationLocale,
  parseTranslationNamespace,
  parseTranslationNamespacesList,
  parseTranslationValue,
  TranslationParamError,
} from './translationParams';

describe('translationParams', () => {
  it('detects unsafe path payloads', () => {
    expect(containsUnsafePathPayload('../etc/passwd')).toBe(true);
    expect(containsUnsafePathPayload('common')).toBe(false);
    expect(containsUnsafePathPayload('%2e%2e%2fsecrets')).toBe(true);
  });

  it('parses allowed locale and namespace', () => {
    expect(parseTranslationLocale('en')).toBe('en');
    expect(parseTranslationLocale(undefined)).toBe('uk');
    expect(parseTranslationNamespace('ui')).toBe('ui');
    expect(parseTranslationNamespace(undefined)).toBe('common');
  });

  it('rejects invalid locale and namespace', () => {
    expect(() => parseTranslationLocale('ru')).toThrow(TranslationParamError);
    expect(() => parseTranslationNamespace('secrets')).toThrow(TranslationParamError);
  });

  it('validates translation keys', () => {
    expect(parseTranslationKey('leaderboard.title')).toBe('leaderboard.title');
    expect(() => parseTranslationKey('../leaderboard')).toThrow(TranslationParamError);
    expect(() => parseTranslationKey('bad key')).toThrow(TranslationParamError);
  });

  it('validates translation values', () => {
    expect(parseTranslationValue('Leaderboard')).toBe('Leaderboard');
    expect(() => parseTranslationValue('   ')).toThrow(TranslationParamError);
  });

  it('parses unique namespaces list', () => {
    expect(parseTranslationNamespacesList('ui,missions,ui')).toEqual(['ui', 'missions']);
    expect(() => parseTranslationNamespacesList('ui,../hack')).toThrow(TranslationParamError);
    expect(() => parseTranslationNamespacesList('')).toThrow(TranslationParamError);
  });

  it('parses bulk translation items', () => {
    expect(parseTranslationBulkItems([{ key: 'leaderboard', value: 'Leaderboard' }])).toEqual([
      { key: 'leaderboard', value: 'Leaderboard' },
    ]);
    expect(() => parseTranslationBulkItems([])).toThrow(TranslationParamError);
  });

  it('handles translation param errors in api responses', () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const handled = handleTranslationParamError(new TranslationParamError('bad key'), {
      status,
    });

    expect(handled).toBe(true);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: 'bad key' });
  });
});
