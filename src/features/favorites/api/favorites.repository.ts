/**
 * 즐겨찾기(찜하기) 데이터 계층.
 *
 * 스탬프가 "다녀왔다"라면 즐겨찾기는 "가고 싶다"다. RLS 로 본인 것만 다룬다.
 */

import { supabase } from '@/shared/api/supabase';

const TABLE = 'favorites';

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function isFavorite(siteId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from(TABLE)
    .select('site_id')
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle();

  if (error) {
    console.error('isFavorite error:', error);
    return false;
  }
  return Boolean(data);
}

/** 찜을 켜거나 끈다. 반환값은 토글 후 상태. */
export async function toggleFavorite(
  siteId: string,
  next: boolean,
): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: 'UNAUTHENTICATED' };

  if (next) {
    const { error } = await supabase
      .from(TABLE)
      .upsert({ user_id: userId, site_id: siteId }, { onConflict: 'user_id,site_id' });
    if (error) {
      console.error('toggleFavorite(on) error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  }

  const { error } = await supabase.from(TABLE).delete().eq('user_id', userId).eq('site_id', siteId);
  if (error) {
    console.error('toggleFavorite(off) error:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** 내가 찜한 성지 id 목록 (최신순). */
export async function getMyFavoriteIds(): Promise<string[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from(TABLE)
    .select('site_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getMyFavoriteIds error:', error);
    return [];
  }
  return (data ?? []).map((row) => row.site_id as string);
}
