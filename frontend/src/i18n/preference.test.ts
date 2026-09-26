import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  pickNavigatorLanguage,
  resolveLanguage,
  getLanguagePreference,
  LANG_PREF_KEY,
  I18N_LNG_KEY,
} from '../i18n/preference';
import i18n, { setLanguagePreference } from '../i18n';

describe('language preference', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('pickNavigatorLanguage lee es primero', () => {
    vi.stubGlobal('navigator', { languages: ['es-ES', 'en-US'], language: 'es-ES' });
    expect(pickNavigatorLanguage()).toBe('es');
  });

  it('pickNavigatorLanguage lee en', () => {
    vi.stubGlobal('navigator', { languages: ['en-GB'], language: 'en-GB' });
    expect(pickNavigatorLanguage()).toBe('en');
  });

  it('resolveLanguage system usa navigator', () => {
    vi.stubGlobal('navigator', { languages: ['en-US'], language: 'en-US' });
    expect(resolveLanguage('system')).toBe('en');
    expect(resolveLanguage('es')).toBe('es');
  });

  it('getLanguagePreference default system', () => {
    expect(getLanguagePreference()).toBe('system');
  });

  it('setLanguagePreference fuerza en y persiste', async () => {
    setLanguagePreference('en');
    expect(store.get(LANG_PREF_KEY)).toBe('en');
    expect(store.get(I18N_LNG_KEY)).toBe('en');
    await i18n.changeLanguage('en');
    expect(i18n.t('nav.nutrition')).toBe('Nutrition');
  });

  it('setLanguagePreference system limpia i18nextLng', () => {
    store.set(I18N_LNG_KEY, 'en');
    vi.stubGlobal('navigator', { languages: ['es-ES'], language: 'es-ES' });
    setLanguagePreference('system');
    expect(store.get(LANG_PREF_KEY)).toBe('system');
    expect(store.get(I18N_LNG_KEY)).toBeUndefined();
  });
});
