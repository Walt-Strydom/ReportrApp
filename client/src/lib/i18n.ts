import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import language resources
import enTranslation from '@/locales/en.json';
import afTranslation from '@/locales/af.json';
import zuTranslation from '@/locales/zu.json';

// Language resource object
const resources = {
  en: { translation: enTranslation },
  af: { translation: afTranslation },
  zu: { translation: zuTranslation },
  // Empty placeholders for other languages - will use fallback
  xh: { translation: {} },
  st: { translation: {} },
  tn: { translation: {} },
  nso: { translation: {} },
  ts: { translation: {} },
  ss: { translation: {} },
  ve: { translation: {} },
  nr: { translation: {} },
};

// Languages configuration
export const supportedLngs = [
  { code: 'en', name: 'English' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'zu', name: 'isiZulu' },
  { code: 'xh', name: 'isiXhosa' },
  { code: 'st', name: 'Sesotho' },
  { code: 'tn', name: 'Setswana' },
  { code: 'nso', name: 'Sepedi' },
  { code: 'ts', name: 'Xitsonga' },
  { code: 'ss', name: 'siSwati' }, 
  { code: 've', name: 'Tshivenda' },
  { code: 'nr', name: 'isiNdebele' }
];

// i18n configuration
i18n
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    fallbackLng: 'en',
    // Force English for all platforms
    lng: 'en',
    // Debugging in development environment
    debug: import.meta.env.DEV,
    // Common namespace
    defaultNS: 'translation',
    // For pluralization
    interpolation: {
      escapeValue: false, // React already escapes values
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'capitalize') return value.charAt(0).toUpperCase() + value.slice(1);
        return value;
      },
    },
  });

export default i18n;