import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { api } from '../services/api';
import { I18N_NAMESPACES } from './namespaces';

export const loadTranslationsFromAPI = async (
  locale: string,
  namespace: string
): Promise<Record<string, string>> => {
  try {
    return await api.getTranslations(locale, namespace);
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
    return {};
  }
};

export const loadMultipleNamespaces = async (
  locale: string,
  namespaces: string[]
): Promise<void> => {
  try {
    const translations = await api.getTranslationsByNamespaces(locale, namespaces);
    Object.entries(translations).forEach(([ns, resources]) => {
      i18n.addResourceBundle(locale, ns, resources, true, true);
    });
    await i18n.reloadResources(locale, namespaces);
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespaces.join(',')}:`, error);
    throw error;
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: 'uk',
    supportedLngs: ['uk', 'en'],
    nonExplicitSupportedLngs: false,
    fallbackLng: {
      uk: ['uk'],
      en: ['en'],
      default: ['uk'],
    },
    defaultNS: 'common',
    ns: [...I18N_NAMESPACES],
    keySeparator: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
  });

export default i18n;
