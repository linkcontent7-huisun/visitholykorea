import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { useSession } from '@/features/auth/hooks/use-session';
import {
  getLatestCompassResponse,
  saveCompassResponse,
  type CompassAnswers,
} from '../api/compass.repository';

/**
 * 지난번 나침반 결과 — "지난번엔 이곳을 권해드렸어요".
 *
 * 캐시 키에 사용자 id 를 넣는다. 정적 키를 쓰면 같은 기기에서 로그아웃 후
 * 다른 사람이 열었을 때 앞 사람의 기록이 캐시로 보일 수 있다 — 감정·고민이
 * 담긴 개인 기록이라 절대 넘어가면 안 되는 선이다.
 */
export function useCompassMemory() {
  const { session } = useSession();
  const userId = session?.user.id ?? null;

  return useQuery({
    queryKey: queryKeys.compass.latest(userId ?? 'anon'),
    queryFn: getLatestCompassResponse,
    enabled: userId != null,
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
      void queryClient.invalidateQueries({ queryKey: ['compass', 'latest'] });
    },
  });
}
