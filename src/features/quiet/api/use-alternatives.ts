/**
 * "붐비는 관광지 → 조용한 성지" 조회 훅.
 *
 * 검색과 추천을 **일부러 두 단계로 나눴다.** 이름 하나로 관광지를 특정할 수 없기
 * 때문이다 — "명동"으로 검색하면 명동성당·명동거리·명동예술극장이 모두 잡힌다.
 * 첫 결과를 임의로 고르면 사용자가 생각한 곳과 다른 곳의 붐빔을 보여주게 된다.
 * 그래서 후보를 보여주고 고르게 한 뒤, 고른 것으로만 추천을 돌린다.
 */

import { useQuery } from '@tanstack/react-query';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { searchAttractionsByKeyword } from '@/shared/api/tour-api';
import { queryKeys } from '@/shared/api/query-keys';
import type { HolySite } from '@/shared/types/domain';
import { findAlternatives, type FindAlternativesOptions } from './alternatives';

/** 오늘 날짜(YYYY-MM-DD). 날이 바뀌면 캐시 키가 바뀌어 붐빔을 다시 계산한다. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 1단계 — 관광지 이름으로 후보를 찾는다. (TourAPI 1회)
 *
 * 검색 결과 자체는 TourAPI 응답이므로 저장하지 않는다. React Query 메모리 캐시에
 * 잠깐 머무를 뿐 DB·서비스워커에 넣지 않는다(공모전 규정).
 */
export function useAttractionSearch(keyword: string) {
  const trimmed = keyword.trim();

  return useQuery({
    queryKey: queryKeys.tour.searchKeyword(trimmed),
    queryFn: () => searchAttractionsByKeyword(trimmed),
    // 두 글자 미만이면 결과가 너무 많아 의미가 없다
    enabled: trimmed.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * 2단계 — 고른 관광지의 붐빔과 대체 성지를 계산한다.
 *
 * 호출 수: 전국 축제 1회 + 관광지 인프라 1회 + 후보 성지 N회(기본 6) = 8회 이하.
 */
export function useAlternatives(
  spot: TourApiSpot | null,
  sites: HolySite[],
  options?: FindAlternativesOptions,
) {
  return useQuery({
    // enabled 로 막아 두므로 spot 이 null 인 키는 실제로 조회되지 않는다.
    queryKey: queryKeys.alternatives.forAttraction(spot?.contentid ?? 'none', today()),
    queryFn: () => {
      if (!spot) throw new Error('관광지가 선택되지 않았습니다');
      return findAlternatives(spot, sites, options);
    },
    enabled: spot !== null && sites.length > 0,
    // 붐빔은 그날의 축제·인프라로 정해지므로 하루 안에서는 다시 계산할 이유가 적다.
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}
