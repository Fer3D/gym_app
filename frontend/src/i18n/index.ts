import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './locales/es';
import en from './locales/en';
import {
  getLanguagePreference,
  I18N_LNG_KEY,
  LANG_PREF_KEY,
  pickNavigatorLanguage,
  resolveLanguage,
  syncDocumentLang,
  type LanguagePreference,
} from './preference';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: I18N_LNG_KEY,
      caches: [],
    },
  })
  .then(() => {
    const pref = getLanguagePreference();
    if (pref === 'system') {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(I18N_LNG_KEY);
      }
      void i18n.changeLanguage(pickNavigatorLanguage());
    } else {
      void i18n.changeLanguage(pref);
    }
    syncDocumentLang(i18n.language);
  });

i18n.on('languageChanged', (lng) => {
  syncDocumentLang(lng);
});

export function setLanguagePreference(pref: LanguagePreference) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(LANG_PREF_KEY, pref);
    if (pref === 'system') {
      localStorage.removeItem(I18N_LNG_KEY);
    } else {
      localStorage.setItem(I18N_LNG_KEY, pref);
    }
  }
  if (pref === 'system') {
    void i18n.changeLanguage(pickNavigatorLanguage());
  } else {
    void i18n.changeLanguage(pref);
  }
}

export { resolveLanguage, getLanguagePreference };
export type { LanguagePreference, AppLanguage } from './preference';
export default i18n;
