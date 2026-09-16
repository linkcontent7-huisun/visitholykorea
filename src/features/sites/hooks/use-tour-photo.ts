import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { getTourPhoto, isRetryableTourError, type TourPhoto } from '@/shared/api/tour-api';
import type { TourPhotoRef } from '@/shared/types/domain';

/**
 * 관광공사 사진을 실시간으로 받는다. `ref` 가 없으면 아무것도 부르지 않는다.
 *
 * 저장하지 않는다(ADR 0002) — 메모리 캐시 1시간은 같은 화면을 오가며 같은 사진을
 * 다시 받지 않기 위한 것이고, 새로고침하면 사라진다. 서비스워커 캐시 대상도 아니다.
 *
 * 실패는 조용히 임시 이미지로 돌아간다. 사진은 화면의 부속물이라 오류 문구를 띄울 자리가 아니다.
 * 한도 초과(quota)는 오늘 다시 시도해도 소용없으므로 재시도하지 않는다.
 */
export function useTourPhoto(ref: TourPhotoRef | null | undefined) {
  return useQuery<TourPhoto | null>({
    queryKey: ref ? queryKeys.tour.photo(ref.source, ref.id) : ['tour', 'photo', 'none'],
    queryFn: () => getTourPhoto(ref!),
    enabled: Boolean(ref),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
    retry: (count, error) => count < 1 && isRetryableTourError(error),
  });
}
