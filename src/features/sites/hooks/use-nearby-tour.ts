import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getNearbyAttractions, getNearbyFestivals } from '@/shared/api/tour-api';
import type { Coordinates } from '@/shared/types/domain';

/**
 * TourAPI 조회 훅.
 *
 * `staleTime: 0` 으로 두어 화면에 들어올 때마다 실제로 API 를 다시 호출한다.
 * 공모전 규정상 TourAPI 응답은 저장·재사용 대상이 아니므로, 메모리 캐시도 짧게만 유지한다.
 */
const REALTIME_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 1000 * 30,
  retry: 0,
} as const;

/** 성지 반경 3km 관광지 (성지 상세 페이지의 "주변 정보"). */
export function useNearbyAttractions(coordinates: Coordinates | undefined) {
  const lat = coordinates?.lat ?? null;
  const lng = coordinates?.lng ?? null;

  return useQuery({
    queryKey: queryKeys.tour.nearby(lat ?? 0, lng ?? 0),
    queryFn: () => getNearbyAttractions(lng!, lat!, 3000, 8),
    enabled: lat != null && lng != null,
    ...REALTIME_QUERY_OPTIONS,
  });
}

/** 성지 반경 10km 에서 오늘 이후 열리는 축제·행사. */
export function useNearbyFestivals(coordinates: Coordinates | undefined) {
  const lat = coordinates?.lat ?? null;
  const lng = coordinates?.lng ?? null;

  return useQuery({
    queryKey: queryKeys.tour.festivals(`${lat},${lng}`),
    queryFn: () => getNearbyFestivals(lng!, lat!, 10000, 6),
    enabled: lat != null && lng != null,
    ...REALTIME_QUERY_OPTIONS,
  });
}
