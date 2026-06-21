import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import uk from '../locales/uk.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uk: { translation: uk },
  },
  lng: 'uk',
  fallbackLng: ['uk', 'en'],
  saveMissing: true,
  interpolation: {
    escapeValue: false,
  },
  missingKeyHandler: (lngs, _ns, key) => {
    if (import.meta.env.DEV) {
      console.warn(`Відсутній ключ i18n: ${key} для мов: ${lngs}`);
    }
  },
});

export default i18n;
