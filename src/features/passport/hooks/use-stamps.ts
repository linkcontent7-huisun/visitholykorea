import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { addStamp, getMyStamp, getMyStamps, getSiteNotes } from '../api/stamps.repository';

export function useMyStamps() {
  return useQuery({
    queryKey: queryKeys.passport.stamps,
    queryFn: getMyStamps,
  });
}

/** 이 성지에 대한 내 스탬프 상태(찍었는지 + 내 한 줄). */
export function useMyStamp(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.passport.myStamp(siteId ?? ''),
    queryFn: () => getMyStamp(siteId!),
    enabled: Boolean(siteId),
  });
}

/** 이 성지에 다녀간 사람들의 익명 한 줄 (최신 3개). */
export function useSiteNotes(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.passport.siteNotes(siteId ?? ''),
    queryFn: () => getSiteNotes(siteId!),
    enabled: Boolean(siteId),
    staleTime: 1000 * 60 * 5,
  });
}

/** 스탬프를 찍고(또는 한 줄을 남기고) 여권 관련 캐시를 무효화한다. */
export function useAddStamp(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: string | null = null) => addStamp(siteId, note),
    onSuccess: (result) => {
      if (!result.success) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.passport.stamps });
      void queryClient.invalidateQueries({ queryKey: queryKeys.passport.myStamp(siteId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.passport.siteNotes(siteId) });
    },
  });
}
