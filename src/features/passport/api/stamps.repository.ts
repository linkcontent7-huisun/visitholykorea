/**
 * 순례 스탬프(디지털 순례 여권) 데이터 계층.
 *
 * 로그인한 사용자가 성지를 "다녀왔다"고 기록하면 스탬프가 쌓이고,
 * 개수에 따라 인증서 등급이 올라간다. RLS 로 본인 데이터만 접근할 수 있다.
 */

import { fetchSiteDioceseIndex } from '@/features/sites/api/holy-sites.repository';
import { supabase } from '@/shared/api/supabase';

const TABLE = 'pilgrimage_stamps';

export interface StampedSite {
  stampId: string;
  siteId: string;
  siteName: string;
  diocese: string | null;
  visitedAt: string;
  /** 내가 남긴 방문 한 줄. 없으면 null. */
  note: string | null;
}

export interface CertificateLevel {
  label: string;
  minStamps: number;
  emoji: string;
}

export const CERTIFICATE_LEVELS: CertificateLevel[] = [
  { label: '첫 순례자', minStamps: 1, emoji: '🕯️' },
  { label: '순례 도보자', minStamps: 5, emoji: '🥾' },
  { label: '순례 순례자', minStamps: 10, emoji: '⛪' },
  { label: '순례 구도자', minStamps: 20, emoji: '🌾' },
  { label: '순례 완주자', minStamps: 50, emoji: '🏆' },
];

/** 스탬프 개수로 도달한 최고 등급. 하나도 없으면 null. */
export function getCertificateLevel(stampCount: number): CertificateLevel | null {
  let achieved: CertificateLevel | null = null;
  for (const level of CERTIFICATE_LEVELS) {
    if (stampCount >= level.minStamps) achieved = level;
  }
  return achieved;
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * 성지에 스탬프를 찍는다. 이미 찍은 곳이면 성공으로 취급하되,
 * 한 줄이 딸려 왔다면 그 한 줄만 갱신한다 — 나중에 생각나서 남기는 경우다.
 */
export async function addStamp(
  siteId: string,
  note: string | null = null,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'UNAUTHENTICATED' };
  }

  const { error } = await supabase.from(TABLE).insert({ user_id: userId, site_id: siteId, note });

  if (error) {
    // 23505 = unique 제약 위반(중복 스탬프). 이미 찍은 곳이다.
    if (error.code === '23505') {
      if (note === null) return { success: true };
      const { error: updateError } = await supabase
        .from(TABLE)
        .update({ note })
        .eq('user_id', userId)
        .eq('site_id', siteId);
      if (updateError) {
        console.error('addStamp note update error:', updateError);
        return { success: false, error: updateError.message };
      }
      return { success: true };
    }
    console.error('addStamp error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export interface MyStamp {
  stamped: boolean;
  /** 내가 남긴 한 줄. 안 찍었거나 안 남겼으면 null. */
  note: string | null;
  /** 내가 올린 순례 사진. */
  photoUrl: string | null;
}

export async function getMyStamp(siteId: string): Promise<MyStamp> {
  const userId = await getCurrentUserId();
  if (!userId) return { stamped: false, note: null, photoUrl: null };

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, note, photo_url')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) {
    console.error('getMyStamp error:', error);
    return { stamped: false, note: null, photoUrl: null };
  }
  return { stamped: Boolean(data), note: data?.note ?? null, photoUrl: data?.photo_url ?? null };
}

export interface SiteVisitNote {
  /** 스탬프 id — 신고에 쓴다. 사람을 특정할 수 없는 uuid 다. */
  id: string;
  note: string | null;
  /** 순례자가 남긴 사진. 없으면 null. */
  photoUrl: string | null;
  visitedAt: string;
}

/**
 * 이 성지에 다녀간 사람들의 한 줄 (익명, 최신순).
 *
 * site_visit_notes 뷰를 읽는다 — user_id 가 아예 뷰에 없어서
 * "누가"는 클라이언트까지 오지 않는다.
 */
export async function getSiteNotes(siteId: string, limit = 6): Promise<SiteVisitNote[]> {
  const { data, error } = await supabase
    .from('site_visit_notes')
    .select('id, note, photo_url, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getSiteNotes error:', error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    note: (row.note as string | null) ?? null,
    photoUrl: (row.photo_url as string | null) ?? null,
    visitedAt: row.created_at as string,
  }));
}

/**
 * 스탬프에 순례 사진을 붙인다. 파일은 본인 uid 폴더에 넣는다(스토리지 정책).
 * 같은 성지에 다시 올리면 덮어쓴다 — 더 나은 사진으로 바꾸는 경우다.
 */
export async function attachStampPhoto(
  siteId: string,
  photo: Blob,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: '로그인이 필요합니다' };

  const path = `${userId}/${siteId}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from('pilgrim-photos')
    .upload(path, photo, { upsert: true, contentType: 'image/jpeg' });
  if (uploadError) {
    console.error('attachStampPhoto upload error:', uploadError);
    return { success: false, error: '사진을 올리지 못했어요. 잠시 후 다시 시도해주세요.' };
  }

  const { data: pub } = supabase.storage.from('pilgrim-photos').getPublicUrl(path);
  // 덮어써도 URL 이 같아 브라우저가 옛 사진을 보여준다 — 버전 파라미터로 깨뜨린다
  const url = `${pub.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase
    .from(TABLE)
    .update({ photo_url: url })
    .eq('user_id', userId)
    .eq('site_id', siteId);
  if (error) {
    console.error('attachStampPhoto update error:', error);
    return { success: false, error: '사진 기록에 실패했어요.' };
  }
  return { success: true };
}

/** 부적절한 글·사진 신고. 3명이 신고하면 서버가 자동으로 숨긴다. */
export async function reportVisitNote(stampId: string): Promise<{ success: boolean }> {
  const { error } = await supabase.rpc('report_visit_note', { p_stamp_id: stampId });
  if (error) {
    console.error('reportVisitNote error:', error);
    return { success: false };
  }
  return { success: true };
}

interface StampJoinRow {
  id: string;
  created_at: string;
  site_id: string;
  note: string | null;
  holy_sites: { name: string; diocese: string | null } | null;
}

/** 로그인한 사용자의 모든 스탬프(성지 정보 포함)를 최신순으로. */
export async function getMyStamps(): Promise<StampedSite[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, created_at, site_id, note, holy_sites(name, diocese)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMyStamps error:', error);
    return [];
  }

  return (data as unknown as StampJoinRow[]).map((row) => ({
    stampId: row.id,
    siteId: row.site_id,
    siteName: row.holy_sites?.name ?? '알 수 없는 성지',
    diocese: row.holy_sites?.diocese ?? null,
    visitedAt: row.created_at,
    note: row.note,
  }));
}

export type DioceseProgress = Record<string, { visited: number; total: number }>;

/** 교구별 완주 현황 (모은 스탬프 수 / 해당 교구 전체 성지 수). */
export async function getDioceseProgress(): Promise<DioceseProgress> {
  const [allSites, stamps] = await Promise.all([fetchSiteDioceseIndex(), getMyStamps()]);

  const visitedSiteIds = new Set(stamps.map((s) => s.siteId));
  const progress: DioceseProgress = {};

  for (const site of allSites) {
    const key = site.diocese ?? '기타';
    const entry = (progress[key] ??= { visited: 0, total: 0 });
    entry.total += 1;
    if (visitedSiteIds.has(site.id)) {
      entry.visited += 1;
    }
  }

  return progress;
}
