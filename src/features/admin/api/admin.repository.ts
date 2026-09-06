/**
 * 관리자 콘솔 접근 계층.
 *
 * DB 행(snake_case) → 도메인 타입(camelCase) 변환은 이 파일에서만 한다.
 * 권한 검사는 **여기서 하지 않는다** — 화면에서 막는 건 눈속임일 뿐이고,
 * 실제 차단은 DB 의 RLS 정책과 security definer 함수가 한다
 * (`supabase/migrations/20260906000000_create_admin_console.sql`).
 * 이 파일이 하는 일은 "권한이 없으면 서버가 거절한다"를 사람 말로 옮기는 것뿐이다.
 */

import { supabase } from '@/shared/api/supabase';
import type { AdminPendingPhotoRow, AdminRole, SiteRevisionRow } from '@/shared/types/database';

/** 대기열 한 줄 — 이 성지에 무엇이 비어 있는가. */
export interface AdminSiteSummary {
  id: string;
  name: string;
  diocese: string;
  hasPhoto: boolean;
  hasDescription: boolean;
  hasHistory: boolean;
  /** 비어 있는 항목 수. 많이 빈 곳을 위로 올리는 데 쓴다. */
  missingCount: number;
}

/** 편집 화면이 다루는 칸만 모은 형태. 이름·교구·좌표는 일부러 뺐다(구조는 안 건드린다). */
export interface AdminSiteDraft {
  id: string;
  name: string;
  diocese: string;
  location: string;
  description: string;
  history: string;
  imageUrl: string | null;
  imageSource: string;
  imageLicense: string;
  phone: string;
  homepageUrl: string;
}

/** 저장 가능한 칸. DB 칸 이름 그대로 두어 update 에 바로 넘긴다. */
export interface AdminSitePatch {
  location: string;
  description: string;
  history: string;
  image_source: string;
  image_license: string;
  phone: string;
  homepage_url: string;
}

export interface AdminPendingPhoto {
  stampId: string;
  siteId: string;
  siteName: string;
  photoUrl: string;
  note: string | null;
  featured: boolean;
  createdAt: string;
}

export interface SiteRevision {
  id: string;
  changedAt: string;
  fields: string[];
  before: Record<string, unknown>;
}

export interface AdminResult {
  success: boolean;
  error?: string;
}

/** 빈 문자열은 DB 에 null 로 넣는다 — ''와 null 이 섞이면 "비었나" 판단이 흔들린다. */
function nullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** 서버가 거절한 이유를 사람 말로. 권한 오류는 이유를 정확히 알려야 다음 행동이 나온다. */
function toMessage(error: { message: string }, fallback: string): string {
  if (error.message.includes('권한')) return '이 성지를 고칠 권한이 없습니다.';
  console.error('admin.repository:', error.message);
  return fallback;
}

/** 내 권한 등급. 로그인하지 않았으면 member 가 나온다. */
export async function fetchMyRole(): Promise<AdminRole> {
  const { data, error } = await supabase.rpc('admin_role');
  if (error) {
    console.error('fetchMyRole error:', error.message);
    return 'member';
  }
  return (data as AdminRole | null) ?? 'member';
}

/**
 * 「오늘 채울 곳」 대기열.
 *
 * 208줄을 그냥 늘어놓으면 어디부터 손댈지 알 수 없다. 비어 있는 항목 수로
 * 정렬해서 **가장 많이 빈 곳이 맨 위**에 오게 한다.
 * 권한이 없는 사람도 성지 목록 자체는 읽을 수 있다(공개 데이터). 막는 건 저장 쪽이다.
 */
export async function fetchAdminQueue(): Promise<AdminSiteSummary[]> {
  const { data, error } = await supabase
    .from('holy_sites')
    .select('id, name, diocese, image_url, description, history')
    .order('name');

  if (error) {
    throw new Error(`fetchAdminQueue: ${error.message}`);
  }

  return (data ?? []).map(toSiteSummary).sort(byMostMissing);
}

/** 대기열 한 줄 만들기. 빈 문자열도 "없음"으로 친다 — 공백만 있는 소개글은 없는 것이다. */
export function toSiteSummary(row: Record<string, unknown>): AdminSiteSummary {
  const filled = (value: unknown) => typeof value === 'string' && value.trim() !== '';
  const hasPhoto = filled(row.image_url);
  const hasDescription = filled(row.description);
  const hasHistory = filled(row.history);

  return {
    id: row.id as string,
    name: row.name as string,
    diocese: (row.diocese as string | null) ?? '',
    hasPhoto,
    hasDescription,
    hasHistory,
    missingCount: [hasPhoto, hasDescription, hasHistory].filter((v) => !v).length,
  };
}

/** 많이 빈 곳이 위로. 같으면 이름순 — 목록 순서가 매번 바뀌면 어디까지 했는지 잊는다. */
export function byMostMissing(a: AdminSiteSummary, b: AdminSiteSummary): number {
  return b.missingCount - a.missingCount || a.name.localeCompare(b.name, 'ko');
}

/** 편집할 성지 1곳. */
export async function fetchSiteDraft(id: string): Promise<AdminSiteDraft> {
  const { data, error } = await supabase
    .from('holy_sites')
    .select(
      'id, name, diocese, location, description, history, image_url, image_source, image_license, phone, homepage_url',
    )
    .eq('id', id)
    .single();

  if (error || !data) {
    throw new Error(`fetchSiteDraft: ${error?.message ?? '성지를 찾지 못했습니다'}`);
  }

  return {
    id: data.id as string,
    name: data.name as string,
    diocese: text(data.diocese),
    location: text(data.location),
    description: text(data.description),
    history: text(data.history),
    imageUrl: (data.image_url as string | null) ?? null,
    imageSource: text(data.image_source),
    imageLicense: text(data.image_license),
    phone: text(data.phone),
    homepageUrl: text(data.homepage_url),
  };
}

/** 글 저장. 이전 값은 DB 트리거가 자동으로 site_revisions 에 남긴다. */
export async function updateSite(id: string, patch: AdminSitePatch): Promise<AdminResult> {
  const { error } = await supabase
    .from('holy_sites')
    .update({
      location: nullable(patch.location),
      description: nullable(patch.description),
      history: nullable(patch.history),
      image_source: nullable(patch.image_source),
      image_license: nullable(patch.image_license),
      phone: nullable(patch.phone),
      homepage_url: nullable(patch.homepage_url),
    })
    .eq('id', id);

  if (error) {
    return { success: false, error: toMessage(error, '저장하지 못했습니다.') };
  }
  return { success: true };
}

/**
 * 대표 사진 교체.
 *
 * 성지당 파일 하나(`<성지id>.jpg`)로 덮어쓴다 — 옛 사진이 저장소에 쌓이지 않는다.
 * 덮어쓰면 URL 이 그대로라 브라우저가 옛 사진을 계속 보여주므로,
 * 순례자 사진과 같은 방식으로 뒤에 버전 값을 붙여 캐시를 깨뜨린다.
 */
export async function uploadSitePhoto(
  siteId: string,
  photo: Blob,
  attribution: { source: string; license: string },
): Promise<AdminResult> {
  const path = `${siteId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from('site-photos')
    .upload(path, photo, { upsert: true, contentType: 'image/jpeg' });

  if (uploadError) {
    return { success: false, error: toMessage(uploadError, '사진을 올리지 못했습니다.') };
  }

  const { data: pub } = supabase.storage.from('site-photos').getPublicUrl(path);
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from('holy_sites')
    .update({
      image_url: url,
      image_source: nullable(attribution.source),
      image_license: nullable(attribution.license),
    })
    .eq('id', siteId);

  if (error) {
    return { success: false, error: toMessage(error, '사진은 올라갔지만 연결에 실패했습니다.') };
  }
  return { success: true };
}

/** 승인함 — 순례자가 올린 사진들. 최근 것이 위로. */
export async function fetchPendingPhotos(): Promise<AdminPendingPhoto[]> {
  const { data, error } = await supabase
    .from('admin_pending_photos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`fetchPendingPhotos: ${error.message}`);
  }

  return ((data ?? []) as AdminPendingPhotoRow[]).map((row) => ({
    stampId: row.stamp_id,
    siteId: row.site_id,
    siteName: row.site_name,
    photoUrl: row.photo_url,
    note: row.note,
    featured: row.photo_featured,
    createdAt: row.created_at,
  }));
}

/** 순례자 사진을 그 성지의 대표 사진으로 승인(또는 승인 취소)한다. */
export async function setPhotoFeatured(stampId: string, featured: boolean): Promise<AdminResult> {
  const { error } = await supabase.rpc('admin_set_photo_featured', {
    p_stamp_id: stampId,
    p_featured: featured,
  });
  if (error) {
    return { success: false, error: toMessage(error, '승인 상태를 바꾸지 못했습니다.') };
  }
  return { success: true };
}

/** 부적절한 사진·글을 즉시 내린다. */
export async function setNoteHidden(stampId: string, hidden: boolean): Promise<AdminResult> {
  const { error } = await supabase.rpc('admin_set_note_hidden', {
    p_stamp_id: stampId,
    p_hidden: hidden,
  });
  if (error) {
    return { success: false, error: toMessage(error, '숨김 처리에 실패했습니다.') };
  }
  return { success: true };
}

/** 이 성지를 언제 무엇을 고쳤는지. 되돌리기의 재료. */
export async function fetchRevisions(siteId: string): Promise<SiteRevision[]> {
  const { data, error } = await supabase
    .from('site_revisions')
    .select('id, changed_at, fields, before')
    .eq('site_id', siteId)
    .order('changed_at', { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`fetchRevisions: ${error.message}`);
  }

  return ((data ?? []) as SiteRevisionRow[]).map((row) => ({
    id: row.id,
    changedAt: row.changed_at,
    fields: row.fields,
    before: row.before,
  }));
}

/**
 * 이력 한 줄로 되돌린다.
 *
 * 되돌리기도 하나의 수정이라 새 이력이 또 쌓인다(되돌리기를 되돌릴 수 있다).
 * 편집 화면이 다루는 칸만 복원한다 — 좌표·교구처럼 화면에서 못 고치는 값은
 * 화면에서 바뀌었을 리가 없으니 건드리지 않는다.
 */
export async function revertSite(
  siteId: string,
  before: Record<string, unknown>,
): Promise<AdminResult> {
  const { error } = await supabase
    .from('holy_sites')
    .update({
      location: (before.location as string | null) ?? null,
      description: (before.description as string | null) ?? null,
      history: (before.history as string | null) ?? null,
      image_url: (before.image_url as string | null) ?? null,
      image_source: (before.image_source as string | null) ?? null,
      image_license: (before.image_license as string | null) ?? null,
      phone: (before.phone as string | null) ?? null,
      homepage_url: (before.homepage_url as string | null) ?? null,
    })
    .eq('id', siteId);

  if (error) {
    return { success: false, error: toMessage(error, '되돌리지 못했습니다.') };
  }
  return { success: true };
}
