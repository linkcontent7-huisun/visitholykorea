/**
 * 성지 한 곳의 인근 혼잡도 — 상세 카드(A-2)가 쓴다. 일정 화면은 카드 3장 몫을 `use-candidate-plans` 가
 * 같은 산식으로 만든다.
 *
 * 호출: 집중률 0~1회(시·군·구 6시간 메모리 캐시).
 * 응답은 TanStack Query 메모리에만 머문다 — DB·localStorage·서비스워커 저장 없음(ADR 0002).
 */

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/api/query-keys';
import type { HolySite } from '@/shared/types/domain';
import { fetchCongestionForSite } from '../api/congestion-lookup';
import {
  combineNearbyCrowding,
  pickCongestion,
  pickQuietDays,
  type NearbyCrowding,
} from '../api/crowding-score';

const SIX_HOURS = 6 * 60 * 60 * 1000;

export interface NearbyCrowdingState {
  /** null = 아직 조회 중이거나 실패 */
  data: NearbyCrowding | null;
  /** 이 성지가 「조용」으로 예측된 날(YYYYMMDD, 가까운 순). 이름 등재 성지가 아니면 빈 배열 */
  quietDays: string[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useNearbyCrowding(site: HolySite | undefined): NearbyCrowdingState {
  const enabled = !!site && site.coordinates.lat != null && site.coordinates.lng != null;

  const congestion = useQuery({
    queryKey: queryKeys.tour.congestion(site?.id ?? ''),
    queryFn: () => fetchCongestionForSite(site!),
    enabled,
    staleTime: SIX_HOURS,
    gcTime: SIX_HOURS,
    retry: 0,
  });

  const data = useMemo(() => {
    if (!site || !congestion.data) return null;
    return combineNearbyCrowding(pickCongestion(site.name, congestion.data.rates));
  }, [site, congestion.data]);

  const quietDays = useMemo(
    () => (site && congestion.data ? pickQuietDays(site.name, congestion.data.rates) : []),
    [site, congestion.data],
  );

  return {
    data,
    quietDays,
    isLoading: enabled && congestion.isPending,
    isError: congestion.isError,
    error: congestion.error,
    refetch: () => {
      void congestion.refetch();
    },
  };
}
