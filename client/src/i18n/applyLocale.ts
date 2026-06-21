import i18n, { loadMultipleNamespaces } from './config';
import { I18N_NAMESPACES } from './namespaces';

export function normalizeLocale(locale: string): 'uk' | 'en' {
  return locale.startsWith('en') ? 'en' : 'uk';
}

export async function applyLocale(locale: string): Promise<void> {
  const lng = normalizeLocale(locale);
  const namespaces = [...I18N_NAMESPACES];

  await loadMultipleNamespaces(lng, namespaces);
  await i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
  i18n.emit('loaded');
}

/** @deprecated Use I18N_NAMESPACES from ./namespaces */
export { I18N_NAMESPACES as NAMESPACES } from './namespaces';
