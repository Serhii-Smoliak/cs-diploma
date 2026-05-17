import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {api} from '../services/api';

export const loadTranslationsFromAPI = async (locale: string, namespace: string): Promise<Record<string, string>> => {
  try {
    return await api.getTranslations(locale, namespace);
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespace}:`, error);
    return {};
  }
};

export const loadMultipleNamespaces = async (locale: string, namespaces: string[]): Promise<void> => {
  try {
    const translations = await api.getTranslationsByNamespaces(locale, namespaces);
    Object.entries(translations).forEach(([ns, resources]) => {
      i18n.addResourceBundle(locale, ns, resources, true, true);
    });
    i18n.reloadResources(locale, namespaces);
  } catch (error) {
    console.error(`Failed to load translations for ${locale}/${namespaces.join(',')}:`, error);
    throw error;
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'uk',
    defaultNS: 'common',
    ns: ['common', 'mitre', 'tasks', 'missions', 'ui', 'skillMatrix', 'levels', 'dialogues'],
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

let isLanguageChanging = false;
i18n.on('languageChanged', async (lng) => {
  if (isLanguageChanging) return;
  isLanguageChanging = true;
  
  try {
    const namespaces = ['common', 'mitre', 'tasks', 'missions', 'ui', 'skillMatrix', 'levels', 'dialogues'];
    await loadMultipleNamespaces(lng, namespaces);
    i18n.emit('loaded');
  } catch (error) {
    console.error('Failed to load translations on language change:', error);
  } finally {
    isLanguageChanging = false;
  }
});

export default i18n;
