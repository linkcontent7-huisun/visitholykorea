import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import type { HolySite } from '@/shared/types/domain';
import { findQuietSites, getCrowdingForSite } from '../api/quiet-sites';

/** 캐시 키에 넣을 오늘 날짜. 날이 바뀌면 지수를 다시 계산한다. */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * TourAPI 응답은 저장·재사용하지 않는다. 화면에 머무는 동안만 메모리에 두고,
 * 다시 들어오면 새로 계산한다.
 */
const REALTIME_OPTIONS = {
  staleTime: 0,
  gcTime: 1000 * 60,
  retry: 0,
  refetchOnWindowFocus: false,
} as const;

/** 오늘 가장 조용한 성지 목록. */
export function useQuietSites(sites: HolySite[], limit = 3) {
  return useQuery({
    queryKey: queryKeys.quiet.today(todayKey(), limit),
    queryFn: () => findQuietSites(sites, { limit }),
    // 성지 목록이 아직 안 왔으면 계산할 것이 없다.
    enabled: sites.length > 0,
    ...REALTIME_OPTIONS,
  });
}

/** 성지 한 곳의 오늘 붐빔 지수. 상세 화면용. */
export function useCrowdingForSite(site: HolySite | undefined) {
  return useQuery({
    queryKey: queryKeys.quiet.site(todayKey(), site?.id ?? ''),
    queryFn: () => getCrowdingForSite(site!),
    enabled: Boolean(site && site.coordinates.lat != null && site.coordinates.lng != null),
    ...REALTIME_OPTIONS,
  });
}
