import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import {
  getBarrierFreeNearby,
  getNearbyAttractions,
  getNearbyByLocation,
  getNearbyFestivals,
} from '@/shared/api/tour-api';
import { groupNearbyFacilities } from '@/features/sites/lib/nearby-facilities';
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

/**
 * 성지 주변 편의시설 — 맛집·숙박·볼거리·쉼터를 **한 번의 호출로** 받는다.
 *
 * `contentTypeId` 를 넘기지 않으면 모든 유형이 한 번에 오므로,
 * 유형별로 네 번 부르는 대신 한 번 부르고 `contenttypeid` 로 나눈다.
 * 성지 한 곳을 열 때 늘어나는 TourAPI 호출은 **0건**이다
 * (기존 주변 관광지 호출이 이것으로 대체된다).
 *
 * 응답은 저장하지 않는다 — `REALTIME_QUERY_OPTIONS` 참조.
 */
export function useNearbyFacilities(coordinates: Coordinates | undefined) {
  const lat = coordinates?.lat ?? null;
  const lng = coordinates?.lng ?? null;

  return useQuery({
    queryKey: queryKeys.tour.facilities(lat ?? 0, lng ?? 0),
    // 반경 5km — 3km 면 시골 성지에서 맛집·숙박이 거의 안 잡힌다.
    queryFn: () =>
      getNearbyByLocation(lng!, lat!, {
        radiusMeters: 5000,
        numOfRows: 50,
        contentTypeId: null,
      }),
    select: (spots) => groupNearbyFacilities(spots),
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

/**
 * 성지 주변 무장애 여행 정보 (반경 5km).
 *
 * 신자 65세 이상 28.9% — 성지는 계단·언덕이 많아 "갈 수 있는가"가 먼저
 * 걸리는 곳이다. 한국관광공사의 무장애 정보를 성지 좌표에 붙인다.
 *
 * 경로는 확인됐고(2026-09-02), **서비스 활용신청 승인 대기 중이라 지금은
 * 403 이 온다.** 그래서 실패를 빈 배열로 흡수한다 — 화면은 결과가 있을 때만
 * 섹션을 그리므로, 승인 전에는 아무 일도 일어나지 않고 승인되는 순간
 * 저절로 나타난다. 다른 TourAPI 호출과 달리 이렇게 하는 이유는, 이 정보가
 * 없다고 해서 잘못된 화면이 만들어지지는 않기 때문이다(붐빔 지수는 없으면
 * "아주 조용"으로 잘못 읽히므로 반대로 실패를 드러낸다).
 */
export function useBarrierFreeNearby(coordinates: Coordinates | undefined) {
  const lat = coordinates?.lat ?? null;
  const lng = coordinates?.lng ?? null;

  return useQuery({
    queryKey: queryKeys.tour.barrierFree(lat ?? 0, lng ?? 0),
    queryFn: () =>
      getBarrierFreeNearby(lng!, lat!, 5000, 8).catch((e) => {
        console.warn('무장애 정보 조회 건너뜀:', e);
        return [];
      }),
    enabled: lat != null && lng != null,
    ...REALTIME_QUERY_OPTIONS,
  });
}
