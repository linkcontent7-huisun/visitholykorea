/**
 * 마음 나침반 응답 데이터 계층.
 *
 * 저장은 비로그인이면 조용히 건너뛴다 — 나침반은 로그인 없이도 쓸 수 있는
 * 기능이고, 기록이 안 남는다고 화면을 막으면 본말이 뒤집힌다.
 */

import { supabase } from '@/shared/api/supabase';
import type { CompassResponseRow } from '@/shared/types/database';

export interface CompassAnswers {
  emotion: string;
  concern: string | null;
  gender: string | null;
  region: string | null;
  style: string | null;
  timeBudget: string | null;
  /** 몇 명이 가는가. 웰니스 실측 동반자 95.5% — 혼자만 전제하지 않는다. */
  party: string | null;
  note: string | null;
}

export interface CompassMemory {
  answers: CompassAnswers;
  matchedSiteId: string | null;
  matchedSiteName: string | null;
  answeredAt: string;
}

/** 결과 화면에 도달했을 때 한 번 저장한다. 실패해도 화면 흐름을 막지 않는다. */
export async function saveCompassResponse(
  answers: CompassAnswers,
  matchedSiteId: string | null,
  matchedSiteName: string | null,
): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;

  const { error } = await supabase.from('compass_responses').insert({
    user_id: userId,
    answers,
    matched_site_id: matchedSiteId,
    matched_site_name: matchedSiteName,
  });
  if (error) console.error('saveCompassResponse error:', error);
}

/** 가장 최근 응답. 비로그인·기록 없음이면 null. */
export async function getLatestCompassResponse(): Promise<CompassMemory | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('compass_responses')
    .select('answers, matched_site_id, matched_site_name, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('getLatestCompassResponse error:', error);
    return null;
  }
  const row = data as Pick<
    CompassResponseRow,
    'answers' | 'matched_site_id' | 'matched_site_name' | 'created_at'
  >;
  return {
    answers: row.answers as unknown as CompassAnswers,
    matchedSiteId: row.matched_site_id,
    matchedSiteName: row.matched_site_name,
    answeredAt: row.created_at,
  };
}
