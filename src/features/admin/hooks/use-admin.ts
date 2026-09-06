import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/features/auth/hooks/use-session';
import { queryKeys } from '@/shared/api/query-keys';
import type { AdminRole } from '@/shared/types/database';
import {
  fetchAdminQueue,
  fetchMyRole,
  fetchPendingPhotos,
  fetchRevisions,
  fetchSiteDraft,
  revertSite,
  setNoteHidden,
  setPhotoFeatured,
  updateSite,
  uploadSitePhoto,
  type AdminSitePatch,
} from '../api/admin.repository';

export interface AdminAccess {
  role: AdminRole;
  /** 관리자 화면에 들어갈 수 있는가 (admin 또는 editor). */
  canEnter: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
}

/**
 * 내 권한.
 *
 * 로그인하지 않았으면 서버에 물어볼 것도 없이 member 다. 화면을 감추는 용도이며,
 * 실제 차단은 DB 정책이 한다 — 이 값을 조작해도 저장은 서버가 거절한다.
 */
export function useAdminAccess(): AdminAccess {
  const { session, isLoading: sessionLoading } = useSession();

  const query = useQuery({
    queryKey: queryKeys.admin.role,
    queryFn: fetchMyRole,
    enabled: Boolean(session),
    staleTime: 5 * 60 * 1000,
  });

  const role: AdminRole = session ? (query.data ?? 'member') : 'member';

  return {
    role,
    canEnter: role === 'admin' || role === 'editor',
    isLoading: sessionLoading || (Boolean(session) && query.isLoading),
    isLoggedIn: Boolean(session),
  };
}

export function useAdminQueue() {
  return useQuery({ queryKey: queryKeys.admin.queue, queryFn: fetchAdminQueue });
}

export function useSiteDraft(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.siteDraft(siteId ?? ''),
    queryFn: () => fetchSiteDraft(siteId!),
    enabled: Boolean(siteId),
    // 편집 중에 다시 받아 와서 입력하던 내용이 밀려나면 안 된다.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useSiteRevisions(siteId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.admin.revisions(siteId ?? ''),
    queryFn: () => fetchRevisions(siteId!),
    enabled: Boolean(siteId),
  });
}

/** 저장 후 무엇을 다시 받아야 하는지 한 곳에 모아 둔다 — 빠뜨리면 옛 값이 화면에 남는다. */
function useAfterSiteChange(siteId: string) {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.siteDraft(siteId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.sites.detail(siteId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.queue });
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.revisions(siteId) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.sites.all });
  };
}

export function useUpdateSite(siteId: string) {
  const refresh = useAfterSiteChange(siteId);
  return useMutation({
    mutationFn: (patch: AdminSitePatch) => updateSite(siteId, patch),
    onSuccess: (result) => {
      if (result.success) refresh();
    },
  });
}

export function useUploadSitePhoto(siteId: string) {
  const refresh = useAfterSiteChange(siteId);
  return useMutation({
    mutationFn: (input: { photo: Blob; source: string; license: string }) =>
      uploadSitePhoto(siteId, input.photo, { source: input.source, license: input.license }),
    onSuccess: (result) => {
      if (result.success) refresh();
    },
  });
}

export function useRevertSite(siteId: string) {
  const refresh = useAfterSiteChange(siteId);
  return useMutation({
    mutationFn: (before: Record<string, unknown>) => revertSite(siteId, before),
    onSuccess: (result) => {
      if (result.success) refresh();
    },
  });
}

export function usePendingPhotos() {
  return useQuery({ queryKey: queryKeys.admin.pendingPhotos, queryFn: fetchPendingPhotos });
}

/** 승인·숨김. 대표 사진이 바뀌므로 성지 목록 캐시도 같이 비운다. */
export function usePhotoReview() {
  const queryClient = useQueryClient();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.admin.pendingPhotos });
    void queryClient.invalidateQueries({ queryKey: queryKeys.sites.featuredPhotos });
  };

  const feature = useMutation({
    mutationFn: (input: { stampId: string; featured: boolean }) =>
      setPhotoFeatured(input.stampId, input.featured),
    onSuccess: (result) => {
      if (result.success) refresh();
    },
  });

  const hide = useMutation({
    mutationFn: (input: { stampId: string; hidden: boolean }) =>
      setNoteHidden(input.stampId, input.hidden),
    onSuccess: (result) => {
      if (result.success) refresh();
    },
  });

  return { feature, hide };
}
