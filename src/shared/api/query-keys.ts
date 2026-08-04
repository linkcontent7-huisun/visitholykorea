import type { EmotionTag } from '@/shared/types/domain';

/**
 * TanStack Query 캐시 키를 한 곳에 모아 둔다.
 * 키를 문자열로 흩어 놓으면 무효화(invalidate) 대상을 놓치기 쉬워서, 계층 구조로 관리한다.
 */
export const queryKeys = {
  sites: {
    all: ['sites'] as const,
    list: (filters: Record<string, unknown> = {}) => ['sites', 'list', filters] as const,
    detail: (id: string) => ['sites', 'detail', id] as const,
    search: (term: string) => ['sites', 'search', term] as const,
    byDiocese: (diocese: string, category?: string) =>
      ['sites', 'diocese', diocese, category ?? 'all'] as const,
  },
  courses: {
    byEmotion: (emotion: EmotionTag, diocese?: string) =>
      ['courses', emotion, diocese ?? 'all'] as const,
  },
  passport: {
    stamps: ['passport', 'stamps'] as const,
    hasStamp: (siteId: string) => ['passport', 'stamp', siteId] as const,
    dioceseProgress: ['passport', 'diocese-progress'] as const,
  },
  records: {
    logs: ['records', 'logs'] as const,
  },
  tour: {
    nearby: (lat: number, lng: number) => ['tour', 'nearby', lat, lng] as const,
    festivals: (coords: string) => ['tour', 'festivals', coords] as const,
  },
} as const;
