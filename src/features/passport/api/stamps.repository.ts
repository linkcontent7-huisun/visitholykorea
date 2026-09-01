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
  /** 성지 분류 — 스탬프 모티프(건축 도장) 폴백에 쓴다. */
  category: string | null;
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
}

export async function getMyStamp(siteId: string): Promise<MyStamp> {
  const userId = await getCurrentUserId();
  if (!userId) return { stamped: false, note: null };

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, note')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) {
    console.error('getMyStamp error:', error);
    return { stamped: false, note: null };
  }
  return { stamped: Boolean(data), note: data?.note ?? null };
}

export interface SiteVisitNote {
  note: string;
  visitedAt: string;
}

/**
 * 이 성지에 다녀간 사람들의 한 줄 (익명, 최신순).
 *
 * site_visit_notes 뷰를 읽는다 — user_id 가 아예 뷰에 없어서
 * "누가"는 클라이언트까지 오지 않는다.
 */
export async function getSiteNotes(siteId: string, limit = 3): Promise<SiteVisitNote[]> {
  const { data, error } = await supabase
    .from('site_visit_notes')
    .select('note, created_at')
    .eq('site_id', siteId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getSiteNotes error:', error);
    return [];
  }
  return (data ?? []).map((row) => ({
    note: row.note as string,
    visitedAt: row.created_at as string,
  }));
}

interface StampJoinRow {
  id: string;
  created_at: string;
  site_id: string;
  note: string | null;
  holy_sites: { name: string; diocese: string | null; category: string | null } | null;
}

/** 로그인한 사용자의 모든 스탬프(성지 정보 포함)를 최신순으로. */
export async function getMyStamps(): Promise<StampedSite[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, created_at, site_id, note, holy_sites(name, diocese, category)')
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
    category: row.holy_sites?.category ?? null,
    visitedAt: row.created_at,
    note: row.note,
  }));
}

/**
 * 성지 상세에서 한 줄들이 화면에 실제로 보였을 때 읽힘 수를 올린다.
 * 로컬에 마이그레이션(20260901000000)이 아직 안 걸려 있으면 조용히 무시한다 —
 * 카운트는 부가 기능이라 본 화면을 깨뜨리면 안 된다.
 */
export async function recordNoteReads(siteId: string, shownCount: number): Promise<void> {
  if (shownCount <= 0) return;
  const { error } = await supabase.rpc('increment_note_reads', {
    p_site_id: siteId,
    p_limit: shownCount,
  });
  if (error) console.warn('recordNoteReads skipped:', error.message);
}

/**
 * 내 한 줄들의 읽힘 수 (stampId → 읽힌 횟수).
 * RLS 가 본인 것만 통과시키므로 조건 없이 조회해도 안전하다.
 * 테이블이 아직 없으면(마이그레이션 미적용) 빈 맵 — 화면은 그냥 숫자를 숨긴다.
 */
export async function getMyNoteReadCounts(): Promise<Record<string, number>> {
  const userId = await getCurrentUserId();
  if (!userId) return {};

  const { data, error } = await supabase.from('note_read_counts').select('stamp_id, read_count');
  if (error) {
    console.warn('getMyNoteReadCounts skipped:', error.message);
    return {};
  }
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.stamp_id as string] = row.read_count as number;
  }
  return counts;
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
