import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getMyFavoriteIds, isFavorite, toggleFavorite } from '../api/favorites.repository';

export function useIsFavorite(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.favorites.one(siteId ?? ''),
    queryFn: () => isFavorite(siteId!),
    enabled: Boolean(siteId),
  });
}

export function useMyFavoriteIds() {
  return useQuery({
    queryKey: queryKeys.favorites.ids,
    queryFn: getMyFavoriteIds,
  });
}

/** 찜 토글. 성공 시 상세·목록 캐시를 함께 갱신한다. */
export function useToggleFavorite(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (next: boolean) => toggleFavorite(siteId, next),
    onSuccess: (result) => {
      if (!result.success) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.one(siteId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.ids });
    },
  });
}
