/**
 * 성지 한 곳의 인근 혼잡도 — 상세 카드(A-2)가 쓴다. 일정 화면은 카드 3장 몫을 `use-candidate-plans` 가
 * 같은 산식으로 만든다.
 *
 * 호출: 오늘 전국 축제 1회(날짜 단위 캐시, 다른 화면과 공유) + 집중률 0~1회(시·군·구 6시간 메모리 캐시).
 * 응답은 TanStack Query 메모리에만 머문다 — DB·localStorage·서비스워커 저장 없음(ADR 0002).
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/api/query-keys';
import { getOngoingFestivals } from '@/shared/api/tour-api';
import type { HolySite } from '@/shared/types/domain';
import { fetchCongestionForSite } from '../api/congestion-lookup';
import {
  combineNearbyCrowding,
  festivalPressure,
  pickCongestion,
  type NearbyCrowding,
} from '../api/crowding-score';

/** 오늘 날짜(YYYY-MM-DD). 자정이 지나면 키가 바뀌어 축제를 다시 받는다. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const SIX_HOURS = 6 * 60 * 60 * 1000;

export interface NearbyCrowdingState {
  /** null = 아직 조회 중이거나 실패 */
  data: NearbyCrowding | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useNearbyCrowding(site: HolySite | undefined): NearbyCrowdingState {
  const enabled = !!site && site.coordinates.lat != null && site.coordinates.lng != null;

  const festivals = useQuery({
    queryKey: queryKeys.festivals.ongoing(today()),
    queryFn: () => getOngoingFestivals(),
    enabled,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const congestion = useQuery({
    queryKey: queryKeys.tour.congestion(site?.id ?? ''),
    queryFn: () => fetchCongestionForSite(site!),
    enabled,
    staleTime: SIX_HOURS,
    gcTime: SIX_HOURS,
    retry: 0,
  });

  const data = useMemo(() => {
    if (!site || !festivals.data || !congestion.data) return null;
    return combineNearbyCrowding(
      festivalPressure(site.coordinates, festivals.data),
      pickCongestion(site.name, congestion.data.rates),
    );
  }, [site, festivals.data, congestion.data]);

  return {
    data,
    isLoading: enabled && (festivals.isPending || congestion.isPending),
    isError: festivals.isError || congestion.isError,
    error: congestion.error ?? festivals.error,
    refetch: () => {
      void festivals.refetch();
      void congestion.refetch();
    },
  };
}
