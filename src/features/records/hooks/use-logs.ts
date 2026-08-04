import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getMyLogs } from '../api/logs.repository';

export function useMyLogs() {
  return useQuery({
    queryKey: queryKeys.records.logs,
    queryFn: getMyLogs,
  });
}
