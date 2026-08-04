import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { addStamp, getMyStamps, hasStamp } from '../api/stamps.repository';

export function useMyStamps() {
  return useQuery({
    queryKey: queryKeys.passport.stamps,
    queryFn: getMyStamps,
  });
}

export function useHasStamp(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.passport.hasStamp(siteId ?? ''),
    queryFn: () => hasStamp(siteId!),
    enabled: Boolean(siteId),
  });
}

/** 스탬프를 찍고 여권 관련 캐시를 무효화한다. */
export function useAddStamp(siteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => addStamp(siteId),
    onSuccess: (result) => {
      if (!result.success) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.passport.stamps });
      void queryClient.invalidateQueries({ queryKey: queryKeys.passport.hasStamp(siteId) });
    },
  });
}
