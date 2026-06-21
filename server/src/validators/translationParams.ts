import { z } from 'zod';

/** Namespaces used by the client i18n loader (see client/src/main.tsx). */
export const ALLOWED_TRANSLATION_NAMESPACES = [
  'common',
  'auth',
  'mitre',
  'tasks',
  'missions',
  'ui',
  'skillMatrix',
  'levels',
  'dialogues',
  'profile',
  'agreement',
  'faq',
] as const;

export const ALLOWED_TRANSLATION_LOCALES = ['uk', 'en'] as const;

/** Matches seed/client i18n keys (e.g. close, killChain.stage.initial-access). */
export const TRANSLATION_KEY_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
export const TRANSLATION_KEY_MAX_LENGTH = 256;
export const TRANSLATION_VALUE_MAX_LENGTH = 10_000;
export const TRANSLATION_BULK_MAX_ITEMS = 500;

const namespaceSet = new Set<string>(ALLOWED_TRANSLATION_NAMESPACES);
const localeSet = new Set<string>(ALLOWED_TRANSLATION_LOCALES);

const UNSAFE_PATH_PATTERN = /(\.\.|\/|\\|%2e%2e|%2f|%5c|%2e%2f|%2e%5c)/i;

export function containsUnsafePathPayload(value: string): boolean {
  if (UNSAFE_PATH_PATTERN.test(value)) {
    return true;
  }
  try {
    const decoded = decodeURIComponent(value);
    if (decoded !== value) {
      return (
        UNSAFE_PATH_PATTERN.test(decoded) ||
        decoded.includes('..') ||
        decoded.includes('/') ||
        decoded.includes('\\')
      );
    }
  } catch {
    return true;
  }
  return false;
}

function assertSafeSegment(value: string, field: string): void {
  if (!value.trim()) {
    throw new TranslationParamError(`${field} must not be empty`);
  }
  if (containsUnsafePathPayload(value)) {
    throw new TranslationParamError(`Invalid ${field}: path traversal sequences are not allowed`);
  }
}

export class TranslationParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranslationParamError';
  }
}

export function parseTranslationLocale(value: unknown, defaultLocale = 'uk'): string {
  const locale = value === undefined || value === '' ? defaultLocale : String(value);
  assertSafeSegment(locale, 'locale');
  if (!localeSet.has(locale)) {
    throw new TranslationParamError(
      `Invalid locale. Allowed: ${ALLOWED_TRANSLATION_LOCALES.join(', ')}`
    );
  }
  return locale;
}

export function parseTranslationNamespace(value: unknown, defaultNamespace = 'common'): string {
  const namespace = value === undefined || value === '' ? defaultNamespace : String(value);
  assertSafeSegment(namespace, 'namespace');
  if (!namespaceSet.has(namespace)) {
    throw new TranslationParamError(
      `Invalid namespace. Allowed: ${ALLOWED_TRANSLATION_NAMESPACES.join(', ')}`
    );
  }
  return namespace;
}

export function parseTranslationKey(value: unknown): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throw new TranslationParamError('key must be a non-empty string');
  }
  const key = value.trim();
  if (!key) {
    throw new TranslationParamError('key must not be empty');
  }
  if (key.length > TRANSLATION_KEY_MAX_LENGTH) {
    throw new TranslationParamError(`key must be at most ${TRANSLATION_KEY_MAX_LENGTH} characters`);
  }
  assertSafeSegment(key, 'key');
  if (!TRANSLATION_KEY_PATTERN.test(key)) {
    throw new TranslationParamError(
      'Invalid key: use dot-separated identifiers (letters, digits, ., _, -)'
    );
  }
  return key;
}

export function parseTranslationValue(value: unknown): string {
  if (value === undefined || value === null || typeof value !== 'string') {
    throw new TranslationParamError('value must be a non-empty string');
  }
  const text = value;
  if (!text.trim()) {
    throw new TranslationParamError('value must not be empty');
  }
  if (text.length > TRANSLATION_VALUE_MAX_LENGTH) {
    throw new TranslationParamError(
      `value must be at most ${TRANSLATION_VALUE_MAX_LENGTH} characters`
    );
  }
  return text;
}

export function parseTranslationBulkItems(value: unknown): Array<{ key: string; value: string }> {
  if (!Array.isArray(value)) {
    throw new TranslationParamError('translations must be an array');
  }
  if (value.length === 0) {
    throw new TranslationParamError('translations must contain at least one item');
  }
  if (value.length > TRANSLATION_BULK_MAX_ITEMS) {
    throw new TranslationParamError(
      `translations must contain at most ${TRANSLATION_BULK_MAX_ITEMS} items`
    );
  }
  return value.map((item, index) => {
    if (item === null || typeof item !== 'object') {
      throw new TranslationParamError(`translations[${index}] must be an object`);
    }
    const row = item as { key?: unknown; value?: unknown };
    return {
      key: parseTranslationKey(row.key),
      value: parseTranslationValue(row.value),
    };
  });
}

export function parseTranslationNamespacesList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    throw new TranslationParamError('namespaces query parameter is required');
  }
  if (typeof value !== 'string') {
    throw new TranslationParamError('namespaces must be a string');
  }

  assertSafeSegment(value, 'namespaces');

  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new TranslationParamError('namespaces must contain at least one namespace');
  }

  const unique = new Set<string>();
  for (const part of parts) {
    assertSafeSegment(part, 'namespace');
    if (!namespaceSet.has(part)) {
      throw new TranslationParamError(
        `Invalid namespace "${part}". Allowed: ${ALLOWED_TRANSLATION_NAMESPACES.join(', ')}`
      );
    }
    unique.add(part);
  }

  return [...unique];
}

export const translationNamespacesQuerySchema = z.object({
  locale: z.string().optional(),
  namespaces: z.string().min(1),
});

export const translationQuerySchema = z.object({
  locale: z.string().optional(),
  namespace: z.string().optional(),
});

export function handleTranslationParamError(
  error: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } }
): boolean {
  if (error instanceof TranslationParamError) {
    res.status(400).json({ error: error.message });
    return true;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: error.errors });
    return true;
  }
  return false;
}
