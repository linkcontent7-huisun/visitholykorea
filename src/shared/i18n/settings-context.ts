import { createContext } from 'react';
import type { Region } from '@/shared/lib/regions';
import type { Language, TranslationKey } from './dictionary';

/** 글자 크기 3단계. 소=100% · 중=112% · 대=125% (globals.css 의 html[data-text-size]). */
export type TextSize = 'sm' | 'md' | 'lg';
export const TEXT_SIZES: readonly TextSize[] = ['sm', 'md', 'lg'];

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
  /**
   * GPS 로 얻은 실제 현재 좌표. `origin`(시·도 선택)과는 별개이며, 있으면
   * 거리 정렬에서 이것을 우선한다. 위치는 이동하므로 세션 간에는 저장하지
   * 않고 켤 때마다 새로 요청한다.
   */
  gpsLocation: { lat: number; lng: number } | null;
  gpsStatus: 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported' | 'error';
  requestGpsLocation: () => void;
  clearGpsLocation: () => void;
  /** 글자 크기 소·중·대. html[data-text-size] 로 전체를 비례 확대한다. */
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  /** @deprecated textSize !== 'sm' 과 같다. 옛 호출부 호환용 — 새 코드는 textSize 를 쓴다. */
  largeText: boolean;
  /** @deprecated true 면 '대', false 면 '소'. */
  setLargeText: (v: boolean) => void;
  t: (key: TranslationKey) => string;
  /**
   * 데스크톱 폭으로 보고 있는지. **사용자가 고르는 값이 아니라 화면 폭으로 자동 판단한다.**
   * 예전에는 화면에 떠 있는 버튼으로 직접 바꿨는데, 그 버튼이 휴대폰에서 하단 탭의
   * `더보기` 를 가려서 지웠다(2026-09-05).
   */
  wideView: boolean;
}

/**
 * 컨텍스트 객체만 별도 파일로 뺐다 — 컴포넌트 파일이 컴포넌트 외의 값을 내보내면
 * Vite 의 빠른 새로고침(Fast Refresh)이 동작하지 않기 때문이다.
 */
export const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);
