import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import {
  addStamp,
  attachStampPhoto,
  getDioceseProgress,
  getMyNoteReadCounts,
  getMyStamp,
  getMyStamps,
  getSiteNotes,
  reportVisitNote,
} from '../api/stamps.repository';

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

/** 교구별 완주 현황 (모은 스탬프 수 / 교구 전체 성지 수). */
export function useDioceseProgress(enabled = true) {
  return useQuery({
    queryKey: queryKeys.passport.dioceseProgress,
    queryFn: getDioceseProgress,
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

/** 내 한 줄들이 읽힌 횟수. 마이그레이션 미적용 환경에서는 빈 맵이 온다. */
export function useMyNoteReadCounts(enabled = true) {
  return useQuery({
    queryKey: queryKeys.passport.noteReads,
    queryFn: getMyNoteReadCounts,
    enabled,
    staleTime: 1000 * 60,
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

/** 스탬프에 순례 사진을 붙인다. 성지 상세의 순례자 이야기가 곧바로 갱신된다. */
export function useAttachPhoto(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photo: Blob) => attachStampPhoto(siteId, photo),
    onSuccess: (result) => {
      if (!result.success) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.passport.myStamp(siteId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.passport.siteNotes(siteId) });
    },
  });
}

/** 부적절한 글·사진 신고. 성공하면 목록만 다시 읽는다(숨김은 서버 판단). */
export function useReportNote(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stampId: string) => reportVisitNote(stampId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.passport.siteNotes(siteId) });
    },
  });
}
