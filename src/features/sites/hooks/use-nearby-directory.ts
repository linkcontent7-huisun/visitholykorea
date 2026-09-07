import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import type { Coordinates } from '@/shared/types/domain';
import { fetchNearbyDirectory, searchDirectory } from '../api/directory.repository';

/**
 * 주변 본당·공소·피정의집. 자체 데이터라 하루 캐시해도 된다.
 * 기본값(반경 5km·5곳)은 성지 상세의 "주변 본당" 카드용. 시·도 랜딩처럼
 * 더 넓게 봐야 하는 화면은 radiusKm·limit 을 넘긴다.
 */
export function useNearbyDirectory(
  coords: Coordinates | undefined,
  radiusKm = 5,
  limit = 5,
) {
  const lat = coords?.lat ?? null;
  const lng = coords?.lng ?? null;

  return useQuery({
    queryKey: queryKeys.directory.nearby(lat ?? 0, lng ?? 0, radiusKm),
    queryFn: () => fetchNearbyDirectory({ lat, lng }, radiusKm, limit),
    enabled: lat != null && lng != null,
    staleTime: 1000 * 60 * 60 * 24,
  });
}

/** 검색어 입력마다 호출되지 않도록 호출부에서 디바운스된 값을 넘긴다. */
export function useDirectorySearch(term: string) {
  return useQuery({
    queryKey: queryKeys.directory.search(term),
    queryFn: () => searchDirectory(term),
    enabled: term.trim().length > 0,
    staleTime: 1000 * 60,
  });
}
