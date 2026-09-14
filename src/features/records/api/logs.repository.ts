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
    photos: row.photos ?? [],
  };
}

export interface NewLog {
  siteId: string;
  title: string;
  content: string;
  /** YYYY-MM-DD */
  visitDate: string;
  /** 성지가 지워져도 기록이 남도록 비정규화해서 함께 저장한다 (스키마 주석 참조). */
  siteName: string | null;
  siteImage: string | null;
}

/** 여행기를 저장한다. 비로그인이면 UNAUTHENTICATED. 성공하면 새 행의 id 를 돌려준다. */
export async function createLog(
  input: NewLog,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { success: false, error: 'UNAUTHENTICATED' };

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      user_id: userId,
      site_id: input.siteId,
      title: input.title,
      content: input.content,
      visit_date: input.visitDate,
      site_name: input.siteName,
      site_image: input.siteImage,
    })
    .select('id')
    .single();

  if (error) {
    console.error('createLog error:', error);
    return { success: false, error: error.message };
  }
  return { success: true, id: (data as { id: string }).id };
}

/**
 * 여행기에 사진을 붙인다. 파일은 본인 uid 폴더(스토리지 정책) 아래 여행기 id 별로 넣고,
 * 공개 URL 을 순서대로 photos 열에 남긴다. 저장 직후 한 번만 부르므로 덮어쓰기다.
 */
export async function attachLogPhotos(
  logId: string,
  photos: Blob[],
): Promise<{ success: boolean; error?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { success: false, error: 'UNAUTHENTICATED' };

  const urls: string[] = [];
  for (let i = 0; i < photos.length; i += 1) {
    const path = `${userId}/logs/${logId}/${i + 1}.jpg`;
    const { error } = await supabase.storage
      .from('pilgrim-photos')
      .upload(path, photos[i]!, { upsert: true, contentType: 'image/jpeg' });
    if (error) {
      console.error('attachLogPhotos upload error:', error);
      return { success: false, error: '사진을 올리지 못했어요. 잠시 후 다시 시도해주세요.' };
    }
    const { data: pub } = supabase.storage.from('pilgrim-photos').getPublicUrl(path);
    urls.push(`${pub.publicUrl}?v=${Date.now()}`);
  }

  const { error } = await supabase.from(TABLE).update({ photos: urls }).eq('id', logId);
  if (error) {
    console.error('attachLogPhotos update error:', error);
    return { success: false, error: '사진 기록을 저장하지 못했어요.' };
  }
  return { success: true };
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
