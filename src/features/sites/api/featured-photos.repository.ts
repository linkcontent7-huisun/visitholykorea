/** 승인된 순례자 대표 사진(site_featured_photos 뷰) 조회. holy-sites.repository.ts 에서 떼어 냈다(#106). */

import { supabase } from '@/shared/api/supabase';

/**
 * 순례자가 올린 사진 중 **운영자가 승인한** 성지 대표 사진 (site_id → url).
 *
 * 사진이 없는 성지(2026-09 기준 157곳)의 빈자리를 실방문자의 사진으로 메운다.
 * 승인된 것만 뷰에 들어오므로 여기서 따로 거를 것이 없다. 전체가 수백 행을
 * 넘지 않아 한 번에 받아 캐시한다 — 목록 화면이 카드마다 질의하지 않도록.
 *
 * 마이그레이션(20260903000000) 미적용 환경에서는 빈 맵을 돌려준다.
 * 대표 사진은 있으면 좋은 것이지 없다고 화면이 깨져서는 안 된다.
 */
export async function fetchFeaturedPilgrimPhotos(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('site_featured_photos').select('site_id, photo_url');

  if (error) {
    console.warn('fetchFeaturedPilgrimPhotos skipped:', error.message);
    return {};
  }

  const photos: Record<string, string> = {};
  for (const row of data ?? []) {
    const url = row.photo_url as string | null;
    if (url) photos[row.site_id as string] = url;
  }
  return photos;
}
