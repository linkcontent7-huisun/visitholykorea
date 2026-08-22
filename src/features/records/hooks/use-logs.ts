import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { createLog, getMyLogs, type NewLog } from '../api/logs.repository';

export function useMyLogs() {
  return useQuery({
    queryKey: queryKeys.records.logs,
    queryFn: getMyLogs,
  });
}

/** 여행기를 저장하고 목록 캐시를 무효화한다. */
export function useCreateLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: NewLog) => createLog(input),
    onSuccess: (result) => {
      if (!result.success) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.records.logs });
    },
  });
}
