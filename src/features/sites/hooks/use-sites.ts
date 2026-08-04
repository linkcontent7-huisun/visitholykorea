import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import {
  fetchSiteById,
  fetchSites,
  fetchSitesByDiocese,
  fetchSitesInSameDiocese,
  searchSites,
} from '../api/holy-sites.repository';

/** 성지 목록. 자체 큐레이션 데이터라 자주 바뀌지 않으므로 staleTime 을 길게 둔다. */
export function useSites(options: { limit?: number; withImageOnly?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.sites.list(options),
    queryFn: () => fetchSites(options),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSite(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sites.detail(id ?? ''),
    queryFn: () => fetchSiteById(id!),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSitesByDiocese(diocese: string | null, category?: string) {
  return useQuery({
    queryKey: queryKeys.sites.byDiocese(diocese ?? '', category),
    queryFn: () => fetchSitesByDiocese(diocese!, category),
    enabled: Boolean(diocese),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSitesInSameDiocese(diocese: string | undefined, excludeId: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.sites.byDiocese(diocese ?? '', 'nearby'), excludeId],
    queryFn: () => fetchSitesInSameDiocese(diocese!, excludeId!),
    enabled: Boolean(diocese && excludeId),
    staleTime: 1000 * 60 * 10,
  });
}

/** 검색어 입력마다 호출되지 않도록 호출부에서 디바운스된 값을 넘긴다. */
export function useSiteSearch(term: string) {
  return useQuery({
    queryKey: queryKeys.sites.search(term),
    queryFn: () => searchSites(term),
    enabled: term.trim().length > 0,
    staleTime: 1000 * 60,
  });
}
