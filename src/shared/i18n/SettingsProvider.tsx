import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DICTIONARY, type Language } from './dictionary';
import { SettingsContext, type SettingsContextValue } from './settings-context';

const STORAGE_KEY_LANG = 'vhk_language';
const STORAGE_KEY_TEXT = 'vhk_large_text';

function readStoredLanguage(): Language {
  return localStorage.getItem(STORAGE_KEY_LANG) === 'en' ? 'en' : 'ko';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readStoredLanguage);
  const [largeText, setLargeText] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY_TEXT) === 'true',
  );
  const [wideView, setWideView] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', largeText ? 'lg' : 'base');
    localStorage.setItem(STORAGE_KEY_TEXT, String(largeText));
  }, [largeText]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem(STORAGE_KEY_LANG, language);
  }, [language]);

  const t = useCallback((key: keyof typeof DICTIONARY) => DICTIONARY[key][language], [language]);

  const value = useMemo<SettingsContextValue>(
    () => ({ language, setLanguage, largeText, setLargeText, t, wideView, setWideView }),
    [language, largeText, t, wideView],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
