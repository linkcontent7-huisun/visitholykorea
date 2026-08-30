import type { EmotionTag } from '@/shared/types/domain';

/**
 * TanStack Query 캐시 키를 한 곳에 모아 둔다.
 * 키를 문자열로 흩어 놓으면 무효화(invalidate) 대상을 놓치기 쉬워서, 계층 구조로 관리한다.
 */
export const queryKeys = {
  sites: {
    translation: (siteId: string, lang: string) => ['sites', 'translation', siteId, lang] as const,
    all: ['sites'] as const,
    list: (filters: Record<string, unknown> = {}) => ['sites', 'list', filters] as const,
    detail: (id: string) => ['sites', 'detail', id] as const,
    search: (term: string) => ['sites', 'search', term] as const,
    dioceseIndex: () => ['sites', 'diocese-index'] as const,
    byDiocese: (diocese: string, category?: string) =>
      ['sites', 'diocese', diocese, category ?? 'all'] as const,
  },
  courses: {
    byEmotion: (emotion: EmotionTag, diocese?: string) =>
      ['courses', emotion, diocese ?? 'all'] as const,
  },
  routes: {
    all: ['routes'] as const,
    detail: (slug: string) => ['routes', 'detail', slug] as const,
  },
  passport: {
    stamps: ['passport', 'stamps'] as const,
    myStamp: (siteId: string) => ['passport', 'stamp', siteId] as const,
    siteNotes: (siteId: string) => ['passport', 'site-notes', siteId] as const,
    dioceseProgress: ['passport', 'diocese-progress'] as const,
  },
  records: {
    logs: ['records', 'logs'] as const,
  },
  compass: {
    latest: (userId: string) => ['compass', 'latest', userId] as const,
  },
  directory: {
    nearby: (lat: number, lng: number) => ['directory', 'nearby', lat, lng] as const,
  },
  favorites: {
    ids: ['favorites', 'ids'] as const,
    one: (siteId: string) => ['favorites', siteId] as const,
  },
  tour: {
    nearby: (lat: number, lng: number) => ['tour', 'nearby', lat, lng] as const,
    /** 맛집·숙박·볼거리를 한 번에 받는 조회. 유형별로 나눠 부르지 않는다. */
    facilities: (lat: number, lng: number) => ['tour', 'facilities', lat, lng] as const,
    festivals: (coords: string) => ['tour', 'festivals', coords] as const,
    searchKeyword: (keyword: string) => ['tour', 'search', keyword] as const,
  },
  quiet: {
    /** 오늘 조용한 성지. 날짜가 바뀌면 키가 바뀌어 자동으로 다시 계산된다. */
    today: (date: string, limit: number) => ['quiet', 'today', date, limit] as const,
    site: (date: string, siteId: string) => ['quiet', 'site', date, siteId] as const,
  },
  alternatives: {
    /** 붐비는 관광지의 대체 성지. TourAPI contentid 기준. */
    forAttraction: (contentId: string, date: string) => ['alternatives', contentId, date] as const,
  },
} as const;
