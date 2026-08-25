import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import type { Coordinates } from '@/shared/types/domain';
import { fetchNearbyDirectory } from '../api/directory.repository';

/** 성지 주변 본당·공소·피정의집. 자체 데이터라 하루 캐시해도 된다. */
export function useNearbyDirectory(coords: Coordinates | undefined) {
  const lat = coords?.lat ?? null;
  const lng = coords?.lng ?? null;

  return useQuery({
    queryKey: queryKeys.directory.nearby(lat ?? 0, lng ?? 0),
    queryFn: () => fetchNearbyDirectory({ lat, lng }),
    enabled: lat != null && lng != null,
    staleTime: 1000 * 60 * 60 * 24,
  });
}
