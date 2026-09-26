export type AppLanguage = 'es' | 'en';
export type LanguagePreference = 'system' | AppLanguage;

export const LANG_PREF_KEY = 'fittrack.langPref';
export const I18N_LNG_KEY = 'i18nextLng';

export function pickNavigatorLanguage(): AppLanguage {
  const candidates =
    typeof navigator !== 'undefined'
      ? [...(navigator.languages?.length ? navigator.languages : []), navigator.language]
      : [];

  for (const raw of candidates) {
    const code = String(raw || '')
      .toLowerCase()
      .split('-')[0];
    if (code === 'es') return 'es';
    if (code === 'en') return 'en';
  }
  return 'es';
}

export function getLanguagePreference(): LanguagePreference {
  if (typeof localStorage === 'undefined') return 'system';
  const value = localStorage.getItem(LANG_PREF_KEY);
  if (value === 'es' || value === 'en' || value === 'system') return value;
  return 'system';
}

export function resolveLanguage(pref: LanguagePreference = getLanguagePreference()): AppLanguage {
  if (pref === 'system') return pickNavigatorLanguage();
  return pref;
}

export function syncDocumentLang(lng: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng.toLowerCase().startsWith('en') ? 'en' : 'es';
}
