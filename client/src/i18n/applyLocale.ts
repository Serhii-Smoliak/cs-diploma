import i18n, { loadMultipleNamespaces } from './config';

const NAMESPACES = [
  'common',
  'mitre',
  'tasks',
  'missions',
  'ui',
  'skillMatrix',
  'levels',
  'dialogues',
  'profile',
] as const;

export function normalizeLocale(locale: string): 'uk' | 'en' {
  return locale.startsWith('en') ? 'en' : 'uk';
}

export async function applyLocale(locale: string): Promise<void> {
  const lng = normalizeLocale(locale);
  await loadMultipleNamespaces(lng, [...NAMESPACES]);
  await i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
  i18n.emit('languageChanged', lng);
}

export { NAMESPACES };
