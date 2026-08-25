/**
 * 교구 주소록(catholic_directory) 데이터 계층.
 *
 * 5,918건은 우리가 직접 수집한 자체 데이터라 자유롭게 조회·캐싱할 수 있다
 * (TourAPI 와 다른 점). 반경 검색은 사각 범위 질의 + 클라이언트 거리 계산
 * 2단계로 한다 — 근거는 lib/nearby-directory.ts 상단 주석.
 */

import { supabase } from '@/shared/api/supabase';
import type { Coordinates } from '@/shared/types/domain';
import type { CatholicDirectoryRow } from '@/shared/types/database';
import { bboxAround, rankNearby, type NearbyPlace } from '../lib/nearby-directory';

/** 순례자에게 보여줄 가치가 있는 구분만. 출판사·단체까지 내밀면 소음이 된다. */
const VISITOR_CATEGORIES = ['본당', '공소', '피정의집'];

export async function fetchNearbyDirectory(
  coords: Coordinates,
  radiusKm = 5,
  limit = 5,
): Promise<NearbyPlace[]> {
  const { lat, lng } = coords;
  if (lat == null || lng == null) return [];

  const box = bboxAround(lat, lng, radiusKm);
  const { data, error } = await supabase
    .from('catholic_directory')
    .select('id, name, category, diocese, phone, address, lat, lng')
    .in('category', VISITOR_CATEGORIES)
    .gte('lat', box.latMin)
    .lte('lat', box.latMax)
    .gte('lng', box.lngMin)
    .lte('lng', box.lngMax);

  if (error) {
    console.error('fetchNearbyDirectory error:', error);
    return [];
  }
  return rankNearby(lat, lng, (data ?? []) as CatholicDirectoryRow[], radiusKm, limit);
}
