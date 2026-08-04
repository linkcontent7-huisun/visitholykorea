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

/** 성지에 스탬프를 찍는다. 이미 찍은 곳이면 성공으로 취급한다. */
export async function addStamp(siteId: string): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'UNAUTHENTICATED' };
  }

  const { error } = await supabase.from(TABLE).insert({ user_id: userId, site_id: siteId });

  if (error) {
    // 23505 = unique 제약 위반(중복 스탬프). 이미 찍은 곳이므로 성공으로 본다.
    if (error.code === '23505') return { success: true };
    console.error('addStamp error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function hasStamp(siteId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) {
    console.error('hasStamp error:', error);
    return false;
  }
  return Boolean(data);
}

interface StampJoinRow {
  id: string;
  created_at: string;
  site_id: string;
  holy_sites: { name: string; diocese: string | null } | null;
}

/** 로그인한 사용자의 모든 스탬프(성지 정보 포함)를 최신순으로. */
export async function getMyStamps(): Promise<StampedSite[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, created_at, site_id, holy_sites(name, diocese)')
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
