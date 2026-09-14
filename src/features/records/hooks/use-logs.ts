import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { attachLogPhotos, createLog, getMyLogs, type NewLog } from '../api/logs.repository';

export function useMyLogs() {
  return useQuery({
    queryKey: queryKeys.records.logs,
    queryFn: getMyLogs,
  });
}

/**
 * 여행기를 저장하고(사진이 있으면 이어서 올리고) 목록 캐시를 무효화한다.
 * 글은 저장됐는데 사진만 실패하면 글을 되돌리지 않는다 — 다시 쓰게 하는 쪽이 더 나쁘다.
 * 대신 `photoError` 로 알려 화면이 안내한다.
 */
export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photos = [], ...input }: NewLog & { photos?: Blob[] }) => {
      const created = await createLog(input);
      if (!created.success || !created.id || photos.length === 0) return created;
      const attached = await attachLogPhotos(created.id, photos);
      return attached.success ? created : { ...created, photoError: attached.error };
    },
    onSuccess: (result) => {
      if (!result.success) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.records.logs });
    },
  });
}
