import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { fetchFeaturedPilgrimPhotos } from '../api/holy-sites.repository';

/**
 * 순례자가 올린 승인 대표 사진 맵 (site_id → url).
 *
 * 목록 화면은 카드가 수십 개라도 이 훅 하나를 공유한다 — 캐시 키가 같아
 * 실제 요청은 한 번뿐이다. 대표 사진이 있는 성지가 아직 적어 응답도 작다.
 */
export function useFeaturedPhotos() {
  return useQuery({
    queryKey: queryKeys.sites.featuredPhotos,
    queryFn: fetchFeaturedPilgrimPhotos,
    staleTime: 1000 * 60 * 5,
  });
}

/** 이 성지에 쓸 사진 한 장 — 공식 사진이 우선, 없으면 순례자 사진. */
export function useSitePhoto(
  siteId: string | undefined,
  officialUrl: string | null,
): { url: string | null; fromPilgrim: boolean } {
  const { data: featured = {} } = useFeaturedPhotos();

  if (officialUrl) return { url: officialUrl, fromPilgrim: false };
  const pilgrim = siteId ? (featured[siteId] ?? null) : null;
  return { url: pilgrim, fromPilgrim: pilgrim !== null };
}
