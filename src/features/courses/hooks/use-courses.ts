import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import type { EmotionTag } from '@/shared/types/domain';
import { getRecommendedCourses } from '../api/course-matching';

/**
 * 감정 태그로 추천 코스를 가져온다.
 * TourAPI 실시간 호출이 섞여 있어 응답이 느릴 수 있으므로 결과를 잠깐 캐시하되,
 * TourAPI 응답 자체를 영구 저장하지는 않는다(공모전 규정).
 */
export function useRecommendedCourses(emotion: EmotionTag, diocese?: string, limit = 4) {
  return useQuery({
    queryKey: queryKeys.courses.byEmotion(emotion, diocese),
    queryFn: () => getRecommendedCourses(emotion, diocese, limit),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}
