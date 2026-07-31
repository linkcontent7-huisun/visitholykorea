/**
 * 순례 스탬프(디지털 순례 여권) 서비스.
 * 로그인한 사용자가 성지를 "다녀왔다"고 기록하면 스탬프가 쌓이고,
 * 일정 개수를 모으면 인증서 등급이 올라간다.
 */

import { supabase } from '../lib/supabase';

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

/** 현재 로그인한 사용자의 스탬프 개수 기준으로 도달한 최고 등급을 반환한다. */
export function getCertificateLevel(stampCount: number): CertificateLevel | null {
  let achieved: CertificateLevel | null = null;
  for (const level of CERTIFICATE_LEVELS) {
    if (stampCount >= level.minStamps) achieved = level;
  }
  return achieved;
}

/** 특정 성지에 스탬프를 찍는다 (이미 찍은 곳이면 조용히 무시). */
export async function addStamp(siteId: string): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    return { success: false, error: '로그인이 필요합니다.' };
  }

  const { error } = await supabase
    .from('pilgrimage_stamps')
    .insert({ user_id: userId, site_id: siteId });

  if (error) {
    if (error.code === '23505') {
      // unique 제약(중복 스탬프) 위반 — 이미 찍은 곳이므로 성공으로 취급
      return { success: true };
    }
    console.error('addStamp error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** 특정 성지에 이미 스탬프를 찍었는지 확인한다. */
export async function hasStamp(siteId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return false;

  const { data, error } = await supabase
    .from('pilgrimage_stamps')
    .select('id')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) {
    console.error('hasStamp error:', error);
    return false;
  }
  return !!data;
}

/** 로그인한 사용자의 모든 스탬프(성지 정보 포함)를 최신순으로 가져온다. */
export async function getMyStamps(): Promise<StampedSite[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from('pilgrimage_stamps')
    .select('id, created_at, site_id, holy_sites(name, diocese)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMyStamps error:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    stampId: row.id,
    siteId: row.site_id,
    siteName: row.holy_sites?.name ?? '알 수 없는 성지',
    diocese: row.holy_sites?.diocese ?? null,
    visitedAt: row.created_at,
  }));
}

/** 교구별 완주 현황 (모은 스탬프 수 / 해당 교구 전체 성지 수). */
export async function getDioceseProgress(): Promise<Record<string, { visited: number; total: number }>> {
  const [{ data: allSites }, stamps] = await Promise.all([
    supabase.from('holy_sites').select('id, diocese'),
    getMyStamps(),
  ]);

  const progress: Record<string, { visited: number; total: number }> = {};
  for (const site of allSites ?? []) {
    const key = site.diocese ?? '기타';
    if (!progress[key]) progress[key] = { visited: 0, total: 0 };
    progress[key].total += 1;
  }
  const visitedSiteIds = new Set(stamps.map((s) => s.siteId));
  for (const site of allSites ?? []) {
    if (visitedSiteIds.has(site.id)) {
      const key = site.diocese ?? '기타';
      progress[key].visited += 1;
    }
  }
  return progress;
}
