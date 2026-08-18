import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { fetchRoutes, fetchRouteBySlug } from '../api/pilgrimage-routes.repository';

/** 코스 목록. 자체 데이터라 넉넉히 캐시한다(TourAPI 아님). */
export function usePilgrimageRoutes() {
  return useQuery({
    queryKey: queryKeys.routes.all,
    queryFn: fetchRoutes,
    staleTime: 1000 * 60 * 30,
  });
}

export function usePilgrimageRoute(slug: string) {
  return useQuery({
    queryKey: queryKeys.routes.detail(slug),
    queryFn: () => fetchRouteBySlug(slug),
    staleTime: 1000 * 60 * 30,
    enabled: Boolean(slug),
  });
}
