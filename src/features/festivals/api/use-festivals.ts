/**
 * 「축제 가는 김에」 조회 훅.
 *
 * 🔴 TourAPI 응답을 저장하지 않는다(공모전 규정, ADR 0002). 여기서 받은 축제 목록은
 * TanStack Query 의 **메모리 캐시에만** 잠깐 머문다 — DB·localStorage·서비스워커
 * 어디에도 넣지 않는다. 새로고침하면 다시 실시간으로 받아온다.
 *
 * 호출 수: 화면 1회 로드에 **전국 축제 조회 2회**(300건씩 페이지를 넘겨 받으므로
 * 축제가 많은 날은 최대 3회). 성지 수와는 무관하다 — 성지마다 물으면 208배가 되므로
 * 전국을 한 번에 받은 뒤 거리는 우리가 잰다. 2026-09-05 실측: 오늘 72건 → 2회.
 * 시·도 칩을 바꿔도 추가 호출은 없다 — 이미 받은 목록을 다시 거를 뿐이다.
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/api/query-keys';
import { getOngoingFestivals } from '@/shared/api/tour-api';
import type { Region } from '@/shared/lib/regions';
import type { HolySite } from '@/shared/types/domain';
import { pairFestivalsWithSites, type FestivalWithSites, type PairOptions } from './festival-pairs';

/** 오늘 날짜(YYYY-MM-DD). 날이 바뀌면 캐시 키가 바뀌어 축제 목록을 다시 받는다. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 오늘 진행 중인 전국 축제. TourAPI 를 성지 수와 무관하게 2~3회 부른다(페이지 넘김). */
export function useOngoingFestivals() {
  return useQuery({
    queryKey: queryKeys.festivals.ongoing(today()),
    queryFn: () => getOngoingFestivals(),
    // 오늘 열리는 행사 목록은 하루 안에서 거의 바뀌지 않는다.
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });
}

export interface FestivalPairsResult {
  /** 시·도 필터를 적용한 결과 — 화면에 그릴 목록 */
  pairs: FestivalWithSites[];
  /** 필터 전, 성지가 가까운 축제 전체 수 */
  totalWithSites: number;
  /** 오늘 진행 중인 전국 축제 수 (성지 유무와 무관) */
  totalOngoing: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
}

/**
 * 축제 + 그 옆 성지. 시·도 칩 선택까지 반영한다.
 *
 * 짝짓기는 순수 계산이라 `useMemo` 로 둔다 — 칩을 누를 때마다 API 를 다시 부르지 않는다.
 */
export function useFestivalPairs(
  sites: HolySite[],
  region: Region | null,
  options: Omit<PairOptions, 'region'> = {},
): FestivalPairsResult {
  const { data: festivals, isLoading, isError, error } = useOngoingFestivals();
  const { radiusKm, sitesPerFestival } = options;

  const all = useMemo(
    () =>
      pairFestivalsWithSites(festivals ?? [], sites, {
        ...(radiusKm == null ? {} : { radiusKm }),
        ...(sitesPerFestival == null ? {} : { sitesPerFestival }),
      }),
    [festivals, sites, radiusKm, sitesPerFestival],
  );

  const pairs = useMemo(
    () => (region ? all.filter((pair) => pair.region === region) : all),
    [all, region],
  );

  return {
    pairs,
    totalWithSites: all.length,
    totalOngoing: festivals?.length ?? 0,
    // 성지 목록이 아직 안 왔으면 짝지을 것이 없으므로 "불러오는 중"으로 본다.
    isLoading: isLoading || (sites.length === 0 && !isError),
    isError,
    error,
  };
}
