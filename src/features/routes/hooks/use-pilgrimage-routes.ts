import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { FALLBACK_CHAIN } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import type { PilgrimageRoute, PilgrimageRouteStop } from '@/shared/types/domain';
import {
  fetchRoutes,
  fetchRouteBySlug,
  fetchRouteListTranslations,
  fetchRouteTranslations,
  fetchRouteStopTranslations,
} from '../api/pilgrimage-routes.repository';
import { applyRouteTranslation, resolveRouteTranslation } from '../lib/translated-route';

/** 코스 목록. 자체 데이터라 넉넉히 캐시한다(TourAPI 아님). */
export function usePilgrimageRoutes() {
  return useQuery({
    queryKey: queryKeys.routes.all,
    queryFn: fetchRoutes,
    staleTime: 1000 * 60 * 30,
  });
}

/**
 * 코스 목록 카드의 제목·부제·설명을 현재 언어로 덮어씌운다.
 * `useLocalizedSites` 와 같은 이유 — 카드마다 훅을 부르면 조회가 늘어나므로,
 * 보이는 코스 전체의 번역을 한 번의 조회로 받는다.
 */
export function useLocalizedRoutes(routes: PilgrimageRoute[] | undefined): PilgrimageRoute[] {
  const { language } = useSettings();
  const ids = useMemo(() => (routes ?? []).map((r) => r.id), [routes]);
  const wanted =
    language === 'ko' ? [] : [language, ...FALLBACK_CHAIN[language]].filter((l) => l !== 'ko');

  const { data: byId = {} } = useQuery({
    queryKey: queryKeys.routes.listTranslations(ids, language),
    queryFn: () => fetchRouteListTranslations(ids, wanted),
    enabled: ids.length > 0 && wanted.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  return useMemo(() => {
    if (!routes || Object.keys(byId).length === 0) return routes ?? [];
    return routes.map((r) => {
      const tr = byId[r.id];
      if (!tr) return r;
      return { ...r, title: tr.title ?? r.title, subtitle: tr.subtitle ?? r.subtitle, description: tr.description ?? r.description };
    });
  }, [routes, byId]);
}

export function usePilgrimageRoute(slug: string) {
  return useQuery({
    queryKey: queryKeys.routes.detail(slug),
    queryFn: () => fetchRouteBySlug(slug),
    staleTime: 1000 * 60 * 30,
    enabled: Boolean(slug),
  });
}

/**
 * 코스 상세 본문(제목·부제·설명)을 언어 설정에 따라 번역본으로 겹친 화면용 뷰.
 * `useTranslatedSite` 와 같은 폴백 규칙(요청 언어 → 영어 → 한국어)을 따른다.
 */
export function useTranslatedRoute(route: PilgrimageRoute | undefined) {
  const { language } = useSettings();
  const wanted = language === 'ko' ? [] : [language, ...FALLBACK_CHAIN[language]].filter((l) => l !== 'ko');

  const { data: byLanguage = {} } = useQuery({
    queryKey: queryKeys.routes.translation(route?.id ?? '', wanted.join('+')),
    queryFn: () => fetchRouteTranslations(route!.id, wanted),
    enabled: Boolean(route) && wanted.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  if (!route) return null;
  return applyRouteTranslation(route, resolveRouteTranslation(byLanguage, language));
}

/** 코스 경유지의 note(이 코스에서의 의미)를 언어 설정에 따라 덮어씌운다. */
export function useLocalizedStopNotes(
  routeId: string | undefined,
  stops: PilgrimageRouteStop[] | undefined,
): PilgrimageRouteStop[] {
  const { language } = useSettings();
  const wanted = language === 'ko' ? [] : [language, ...FALLBACK_CHAIN[language]].filter((l) => l !== 'ko');

  const { data: notesBySite = {} } = useQuery({
    queryKey: queryKeys.routes.stopTranslations(routeId ?? '', language),
    queryFn: () => fetchRouteStopTranslations(routeId!, wanted),
    enabled: Boolean(routeId) && wanted.length > 0,
    staleTime: 1000 * 60 * 30,
  });

  return useMemo(() => {
    if (!stops || Object.keys(notesBySite).length === 0) return stops ?? [];
    return stops.map((stop) => {
      const note = notesBySite[stop.site.id];
      return note ? { ...stop, note } : stop;
    });
  }, [stops, notesBySite]);
}
