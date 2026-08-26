import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isRegion, type Region } from '@/shared/lib/regions';
import { DICTIONARY, type Language } from './dictionary';
import { SettingsContext, type SettingsContextValue } from './settings-context';

const STORAGE_KEY_LANG = 'vhk_language';
const STORAGE_KEY_TEXT = 'vhk_large_text';
const STORAGE_KEY_ORIGIN = 'vhk_origin';

function readStoredLanguage(): Language {
  return localStorage.getItem(STORAGE_KEY_LANG) === 'en' ? 'en' : 'ko';
}

/** 저장된 출발지. 값이 시·도 목록에 없으면(이전 버전·손댄 값) 안 고른 것으로 본다. */
function readStoredOrigin(): Region | null {
  const raw = localStorage.getItem(STORAGE_KEY_ORIGIN);
  return isRegion(raw) ? raw : null;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readStoredLanguage);
  const [largeText, setLargeText] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY_TEXT) === 'true',
  );
  const [origin, setOrigin] = useState<Region | null>(readStoredOrigin);
  const [wideView, setWideView] = useState(false);

  useEffect(() => {
    if (origin) localStorage.setItem(STORAGE_KEY_ORIGIN, origin);
    else localStorage.removeItem(STORAGE_KEY_ORIGIN);
  }, [origin]);

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
    () => ({
      language,
      setLanguage,
      largeText,
      setLargeText,
      origin,
      setOrigin,
      t,
      wideView,
      setWideView,
    }),
    [language, largeText, origin, t, wideView],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
