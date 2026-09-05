import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isRegion, type Region } from '@/shared/lib/regions';
import { DICTIONARY, isLanguage, type Language } from './dictionary';
import { SettingsContext, type SettingsContextValue } from './settings-context';

const STORAGE_KEY_LANG = 'vhk_language';
const STORAGE_KEY_TEXT = 'vhk_large_text';
const STORAGE_KEY_ORIGIN = 'vhk_origin';

/**
 * 이 폭부터 데스크톱으로 본다(Tailwind `lg`).
 * 사용자가 고르는 설정이 아니라 기기가 알려주는 사실이므로 저장하지 않는다.
 */
const WIDE_VIEW_QUERY = '(min-width: 1024px)';

/** 테스트 환경(jsdom)에는 matchMedia 가 없다 — 없으면 모바일 폭으로 본다. */
function matchWideView(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(WIDE_VIEW_QUERY).matches
    : false;
}

function readStoredLanguage(): Language {
  const raw = localStorage.getItem(STORAGE_KEY_LANG);
  return isLanguage(raw) ? raw : 'ko';
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
  const [wideView, setWideView] = useState(matchWideView);

  // 창 크기를 바꾸거나 기기를 돌리면 따라 바뀐다.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(WIDE_VIEW_QUERY);
    const onChange = (event: MediaQueryListEvent) => setWideView(event.matches);
    query.addEventListener('change', onChange);
    setWideView(query.matches);
    return () => query.removeEventListener('change', onChange);
  }, []);

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
    }),
    [language, largeText, origin, t, wideView],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
