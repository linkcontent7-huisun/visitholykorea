import { createContext } from 'react';
import type { Region } from '@/shared/lib/regions';
import type { Language, TranslationKey } from './dictionary';

export interface SettingsContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  /**
   * 출발지(시·도). 이걸 정해 두면 홈·탐색이 가까운 성지부터 보여준다.
   * 성지는 전국에 흩어져 있어서, 어디서 출발하는지를 모르면 "갈 수 있는 곳"을 못 고른다.
   * null 이면 아직 안 고른 것 — 전국 기준으로 보여준다.
   */
  origin: Region | null;
  setOrigin: (r: Region | null) => void;
  /** 고령 순례자를 위한 큰 글자 모드. html[data-text-size] 로 전체를 비례 확대한다. */
  largeText: boolean;
  setLargeText: (v: boolean) => void;
  t: (key: TranslationKey) => string;
  /** 개발·검수용 미리보기 폭 전환(모바일 ↔ 데스크톱). 새로고침하면 초기화된다. */
  wideView: boolean;
  setWideView: (v: boolean) => void;
}

/**
 * 컨텍스트 객체만 별도 파일로 뺐다 — 컴포넌트 파일이 컴포넌트 외의 값을 내보내면
 * Vite 의 빠른 새로고침(Fast Refresh)이 동작하지 않기 때문이다.
 */
export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);
