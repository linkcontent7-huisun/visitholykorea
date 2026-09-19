import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { fetchDocentScripts, fetchDocentSiteIds, type DocentSiteScripts } from '../api/docent.repository';

/**
 * DB 도슨트 원고. 원고는 며칠에 한 번 바뀌는 자체 데이터라 길게 캐시한다(TourAPI 응답이 아니다).
 * 실패하면 undefined — 화면은 저장소 JSON 폴백(`getDocentScript`)으로 간다.
 */
export function useDocentScripts(siteId: string | undefined): DocentSiteScripts | undefined {
  const { data } = useQuery({
    queryKey: queryKeys.docent.script(siteId ?? ''),
    queryFn: () => fetchDocentScripts(siteId!),
    enabled: Boolean(siteId),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
  return data;
}

/** 지점 원고가 있는 성지 id 집합. 목록 카드가 공유하므로 한 번만 받는다. */
export function useDocentSiteIds(): Set<string> | undefined {
  const { data } = useQuery({
    queryKey: queryKeys.docent.siteIds,
    queryFn: fetchDocentSiteIds,
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });
  return data;
}
