import React, { createContext, useContext, useEffect, useState } from 'react';

export type Language = 'ko' | 'en';

interface SettingsContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  t: (key: string) => string;
  wideView: boolean;
  setWideView: (v: boolean) => void;
}

const STORAGE_KEY_LANG = 'vhk_language';
const STORAGE_KEY_TEXT = 'vhk_large_text';

/** UI 문구(화면 요소)만 다국어 처리. 성지 콘텐츠 본문 번역은 별도 작업. */
const DICTIONARY: Record<string, { ko: string; en: string }> = {
  home: { ko: '홈', en: 'Home' },
  map: { ko: '지도', en: 'Map' },
  explore: { ko: '탐색', en: 'Explore' },
  record: { ko: '기록', en: 'Record' },
  menu: { ko: '더보기', en: 'More' },
  search: { ko: '검색', en: 'Search' },
  login: { ko: '로그인', en: 'Log in' },
  logout: { ko: '로그아웃', en: 'Log out' },
  signup: { ko: '회원가입', en: 'Sign up' },
  myProfile: { ko: '내 프로필', en: 'My Profile' },
  favorites: { ko: '즐겨찾는 성지', en: 'Favorite Sites' },
  appSettings: { ko: '앱 설정', en: 'App Settings' },
  languageSetting: { ko: '언어 설정', en: 'Language' },
  largeTextSetting: { ko: '큰 글자 모드', en: 'Large Text' },
  supportInfo: { ko: '지원 및 정보', en: 'Support & Info' },
  stampButton: { ko: '순례 스탬프 찍기', en: 'Add Pilgrimage Stamp' },
  stampDone: { ko: '순례 스탬프 완료', en: 'Stamp Collected' },
  pilgrimPassport: { ko: '순례 여권', en: 'Pilgrim Passport' },
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    () => (localStorage.getItem(STORAGE_KEY_LANG) as Language) || 'ko',
  );
  const [largeText, setLargeTextState] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY_TEXT) === 'true',
  );
  // 개발/검수용 미리보기 전환(모바일 ↔ 데스크톱 폭). 실제 서비스 이용자 설정이 아니라 새로고침 시 초기화됨.
  const [wideView, setWideView] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', largeText ? 'lg' : 'base');
    localStorage.setItem(STORAGE_KEY_TEXT, String(largeText));
  }, [largeText]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    localStorage.setItem(STORAGE_KEY_LANG, language);
  }, [language]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const setLargeText = (v: boolean) => setLargeTextState(v);

  const t = (key: string): string => DICTIONARY[key]?.[language] ?? key;

  return (
    <SettingsContext.Provider value={{ language, setLanguage, largeText, setLargeText, t, wideView, setWideView }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
