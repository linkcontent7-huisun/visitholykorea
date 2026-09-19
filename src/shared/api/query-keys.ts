import type { EmotionTag } from '@/shared/types/domain';

/**
 * TanStack Query 캐시 키를 한 곳에 모아 둔다.
 * 키를 문자열로 흩어 놓으면 무효화(invalidate) 대상을 놓치기 쉬워서, 계층 구조로 관리한다.
 */
export const queryKeys = {
  sites: {
    translation: (siteId: string, lang: string) => ['sites', 'translation', siteId, lang] as const,
    /** 목록·카드용 이름·영문 주소 일괄 번역. ids 순서가 같으면 같은 캐시를 쓴다. */
    nameTranslations: (ids: string[], lang: string) =>
      ['sites', 'list-translations', ids, lang] as const,
    all: ['sites'] as const,
    list: (filters: Record<string, unknown> = {}) => ['sites', 'list', filters] as const,
    detail: (id: string) => ['sites', 'detail', id] as const,
    search: (term: string) => ['sites', 'search', term] as const,
    dioceseIndex: () => ['sites', 'diocese-index'] as const,
    byDiocese: (diocese: string, category?: string) =>
      ['sites', 'diocese', diocese, category ?? 'all'] as const,
    /** 순례 별자리 카드용 좌표 인덱스. 성지 좌표는 거의 안 바뀐다. */
    coordsIndex: ['sites', 'coords-index'] as const,
    /** 순례자가 올린 승인된 대표 사진 (site_id → url). 목록·상세가 공유한다. */
    featuredPhotos: ['sites', 'featured-photos'] as const,
  },
  courses: {
    /** 마음(감정 태그)별 성지 전체 — 「오늘의 성지 일정」 후보 pool 의 입력. DB 만이라 캐시해도 된다. */
    byEmotion: (emotion: EmotionTag, language: string) => ['courses', emotion, language] as const,
  },
  routes: {
    all: ['routes'] as const,
    detail: (slug: string) => ['routes', 'detail', slug] as const,
    /** 목록 카드용 제목·부제·설명 일괄 번역. */
    listTranslations: (ids: string[], lang: string) =>
      ['routes', 'list-translations', ids, lang] as const,
    /** 코스 1곳의 전문 번역 — 상세 화면이 폴백까지 겹쳐 쓴다. */
    translation: (routeId: string, lang: string) => ['routes', 'translation', routeId, lang] as const,
    /** 경유지 메모 번역 — 코스 1곳 전체를 한 번에 받는다. */
    stopTranslations: (routeId: string, lang: string) =>
      ['routes', 'stop-translations', routeId, lang] as const,
  },
  passport: {
    stamps: ['passport', 'stamps'] as const,
    myStamp: (siteId: string) => ['passport', 'stamp', siteId] as const,
    siteNotes: (siteId: string) => ['passport', 'site-notes', siteId] as const,
    dioceseProgress: ['passport', 'diocese-progress'] as const,
    /** 내 한 줄들이 읽힌 횟수 (stampId → count). */
    noteReads: ['passport', 'note-reads'] as const,
  },
  records: {
    logs: ['records', 'logs'] as const,
  },
  compass: {
    latest: (userId: string) => ['compass', 'latest', userId] as const,
  },
  directory: {
    nearby: (lat: number, lng: number, radiusKm = 5) =>
      ['directory', 'nearby', lat, lng, radiusKm] as const,
    search: (term: string) => ['directory', 'search', term] as const,
  },
  favorites: {
    ids: ['favorites', 'ids'] as const,
    one: (siteId: string) => ['favorites', siteId] as const,
  },
  tour: {
    nearby: (lat: number, lng: number, language = 'ko') =>
      ['tour', 'nearby', lat, lng, language] as const,
    /** 맛집·숙박·볼거리를 한 번에 받는 조회. 유형별로 나눠 부르지 않는다. */
    facilities: (lat: number, lng: number, language = 'ko') =>
      ['tour', 'facilities', lat, lng, language] as const,
    /** 성지 주변 무장애 여행 정보 (열린관광 축). */
    barrierFree: (lat: number, lng: number) => ['tour', 'barrier-free', lat, lng] as const,
    festivals: (coords: string, language = 'ko') =>
      ['tour', 'festivals', coords, language] as const,
    /** 성지의 시·군·구 관광지 집중률 예측 — 성지 id 로 키를 잡는다(주소 → 코드는 조회 계층이 한다). */
    congestion: (siteId: string) => ['tour', 'congestion', siteId] as const,
    hubSpots: (areaCd: string, signguCd: string, baseYm: string) =>
      ['tour', 'hub-spots', areaCd, signguCd, baseYm] as const,
    audioStories: (lat: number, lng: number, langCode: string) =>
      ['tour', 'audio-stories', lat, lng, langCode] as const,
    walkingCourses: (sigunguName: string) => ['tour', 'walking-courses', sigunguName] as const,
    searchKeyword: (keyword: string) => ['tour', 'search', keyword] as const,
  },
  festivals: {
    /**
     * 「축제 가는 김에」 — 오늘 진행 중인 전국 축제.
     * 날짜를 키에 넣어 자정이 지나면 자동으로 다시 받는다(캐시에 눌러앉지 않게).
     */
    ongoing: (date: string) => ['festivals', 'ongoing', date] as const,
  },
  admin: {
    /** 내 권한 등급. 로그인이 바뀌면 무효화한다. */
    role: ['admin', 'role'] as const,
    /** 「오늘 채울 곳」 대기열 — 무엇이 비었는지. */
    queue: ['admin', 'queue'] as const,
    /** 순례자 사진 승인함. */
    pendingPhotos: ['admin', 'pending-photos'] as const,
    /**
     * 편집 화면이 쓰는 성지 1곳. 공개 상세(`sites.detail`)와 담는 모양이 달라
     * 키를 따로 둔다 — 같은 키를 쓰면 두 화면이 서로의 캐시를 덮어쓴다.
     */
    siteDraft: (siteId: string) => ['admin', 'site-draft', siteId] as const,
    /** 성지 1곳 수정 이력. */
    revisions: (siteId: string) => ['admin', 'revisions', siteId] as const,
  },
} as const;
