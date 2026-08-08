/**
 * 앱 전역에서 쓰는 도메인 타입.
 *
 * DB 컬럼명(snake_case)과 앱 내부 표현(camelCase)을 분리해 두었다.
 * 두 표현 사이의 변환은 `features/sites/api/holy-sites.repository.ts` 한 곳에서만 한다.
 */

/** 성지에 붙는 감성 태그 — "쉼표 순례길" 추천의 입력값. */
export const EMOTION_TAGS = ['위로', '새출발', '평온', '치유', '감사'] as const;
export type EmotionTag = (typeof EMOTION_TAGS)[number];

/** 성지 분류. DB에는 자유 문자열로 들어가므로 알려진 값 + string 으로 둔다. */
export const SITE_CATEGORIES = ['순교성지', '역사사적지', '주교좌성당', '순례길'] as const;
export type SiteCategory = (typeof SITE_CATEGORIES)[number] | (string & {});

/** 천주교 15개 교구. 탐색·필터의 1차 축이다. */
export const DIOCESES = [
  '서울',
  '수원',
  '인천',
  '의정부',
  '춘천',
  '원주',
  '대전',
  '청주',
  '전주',
  '광주',
  '대구',
  '안동',
  '부산',
  '마산',
  '제주',
] as const;
export type Diocese = (typeof DIOCESES)[number];

export interface Coordinates {
  lat: number | null;
  lng: number | null;
}

/** 성지 한 곳. 앱이 직접 수집·큐레이션한 자체 데이터(TourAPI 데이터가 아니다). */
export interface HolySite {
  id: string;
  name: string;
  category: SiteCategory;
  /** 교구 (예: 대전). 없으면 광역 지자체명으로 대체된다. */
  region: string;
  /** 도로명 주소 */
  location: string;
  description: string | null;
  history: string | null;
  imageUrl: string | null;
  coordinates: Coordinates;
  emotionTag: EmotionTag | null;
  seoTitle: string | null;
  seoDescription: string | null;
  nearbyAttractions: string | null;
  nearbyLodging: string | null;
  /**
   * 성지 사무실 연락처.
   *
   * 순례자가 실제로 묻는 것은 "미사가 몇 시인가", "단체가 가도 되는가"이고
   * 그 답은 우리 DB 가 아니라 성지 사무실에 있다. 전화번호를 못 주면
   * 아무리 설명이 길어도 그 질문에 답하지 못한다.
   */
  phone: string | null;
  homepageUrl: string | null;
  /** 성지 사무실은 아직 팩스로 단체 순례 예약을 받는 곳이 있다. */
  fax: string | null;
}

/** 사용자가 남긴 순례 여행기. */
export interface PilgrimageLog {
  id: string;
  userId: string;
  siteId: string;
  title: string;
  content: string;
  visitDate: string;
  siteName?: string;
  siteImage?: string;
}
