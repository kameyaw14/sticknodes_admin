// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation JSONs
import enTranslations from './locales/en/translation.json';
import esTranslations from './locales/es/translation.json';
import frTranslations from './locales/fr/translation.json';

i18n
  // use language detector to automatically detect user language
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations }
    },
    fallbackLng: 'en',               // if user language can’t be found, use English
    debug: false,                    // set to true during development to see logging

    // interpolation settings
    interpolation: {
      escapeValue: false // react already protects from XSS
    }
  });

export default i18n;
