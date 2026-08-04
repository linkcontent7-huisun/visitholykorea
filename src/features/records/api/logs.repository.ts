/**
 * 순례 여행기(pilgrimage_logs) 데이터 계층.
 */

import { supabase } from '@/shared/api/supabase';
import type { PilgrimageLogRow } from '@/shared/types/database';
import type { PilgrimageLog } from '@/shared/types/domain';

const TABLE = 'pilgrimage_logs';

function toLog(row: PilgrimageLogRow): PilgrimageLog {
  return {
    id: row.id,
    userId: row.user_id,
    siteId: row.site_id,
    title: row.title,
    content: row.content,
    visitDate: row.visit_date,
    siteName: row.site_name ?? undefined,
    siteImage: row.site_image ?? undefined,
  };
}

/** 로그인한 사용자의 여행기를 방문일 최신순으로. 비로그인 시 빈 배열. */
export async function getMyLogs(): Promise<PilgrimageLog[]> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .order('visit_date', { ascending: false });

  if (error) {
    console.error('getMyLogs error:', error);
    return [];
  }
  return (data as PilgrimageLogRow[]).map(toLog);
}
