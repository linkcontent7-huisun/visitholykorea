import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/shared/api/query-keys';
import { FALLBACK_CHAIN } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';
import {
  fetchSiteById,
  fetchSiteNameTranslations,
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

/**
 * 목록·카드 화면의 성지 이름을 현재 언어로 덮어씌운다.
 *
 * 성지 상세(`useTranslatedSite`)는 성지 1곳의 설명·역사까지 번역하지만, 카드가
 * 여러 개 늘어서는 화면(홈 그리드·검색 결과·탐색·지도)에서 그 훅을 카드마다 부르면
 * 조회가 카드 수만큼 늘어난다. 여기는 보이는 성지 전체의 이름만 한 번의 조회로
 * 받아 온다. 번역이 없는 성지는 원문 이름(한국어)이 그대로 남는다 — 빈 이름보다 낫다.
 */
export function useLocalizedSites<T extends Pick<HolySite, 'id' | 'name'>>(
  sites: T[] | undefined,
): T[] {
  const { language } = useSettings();
  const ids = useMemo(() => (sites ?? []).map((s) => s.id), [sites]);
  const wanted =
    language === 'ko' ? [] : [language, ...FALLBACK_CHAIN[language]].filter((l) => l !== 'ko');

  const { data: nameById = {} } = useQuery({
    queryKey: queryKeys.sites.nameTranslations(ids, language),
    queryFn: () => fetchSiteNameTranslations(ids, wanted),
    enabled: ids.length > 0 && wanted.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  return useMemo(() => {
    if (!sites || Object.keys(nameById).length === 0) return sites ?? [];
    return sites.map((s) => (nameById[s.id] ? { ...s, name: nameById[s.id] } : s));
  }, [sites, nameById]);
}
