import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationNO from './locales/no.json';
import translationAR from './locales/ar.json';
import translationEN from './locales/en.json';
import translationUK from './locales/uk.json';

const resources = {
  no: {
    translation: translationNO
  },
  ar: {
    translation: translationAR
  },
  en: {
    translation: translationEN
  },
  uk: {
    translation: translationUK
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'no',
    lng: 'no', // Default language
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
