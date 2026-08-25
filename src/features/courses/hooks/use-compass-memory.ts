import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import {
  getLatestCompassResponse,
  saveCompassResponse,
  type CompassAnswers,
} from '../api/compass.repository';

/** 지난번 나침반 결과 — "지난번엔 이곳을 권해드렸어요" */
export function useCompassMemory() {
  return useQuery({
    queryKey: queryKeys.compass.latest,
    queryFn: getLatestCompassResponse,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSaveCompassResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      answers: CompassAnswers;
      matchedSiteId: string | null;
      matchedSiteName: string | null;
    }) => saveCompassResponse(input.answers, input.matchedSiteId, input.matchedSiteName),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.compass.latest });
    },
  });
}
