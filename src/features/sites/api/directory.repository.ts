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

export interface DirectoryEntry {
  id: string;
  name: string;
  category: string;
  diocese: string | null;
  phone: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  nameRomanized: string | null;
  addressRomanized: string | null;
}

const DIRECTORY_COLUMNS =
  'id, name, category, diocese, phone, address, lat, lng, name_romanized, address_romanized';

function toDirectoryEntry(row: CatholicDirectoryRow): DirectoryEntry {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    diocese: row.diocese,
    phone: row.phone,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    nameRomanized: row.name_romanized,
    addressRomanized: row.address_romanized,
  };
}

/**
 * 본당·공소·피정의집 이름·주소·교구 부분 일치 검색.
 *
 * 208곳 성지(holy_sites)와 별개다 — 순례자가 검색창에 "명동"을 치면 성지
 * 명동대성당뿐 아니라 다른 지역 "명동성당" 본당도 찾을 수 있어야 한다는
 * 피드백(2026-09-07)에 대한 답. `VISITOR_CATEGORIES` 로 사회복지기관·수도회 같은
 * 순례자와 무관한 항목은 걸러낸다.
 *
 * `name_romanized`/`address_romanized`(기계적 로마자 표기, 2026-09-07)도 함께
 * 훑는다 — 한글을 못 치는 외국인이 "Myeongdong" 처럼 로마자로 검색해도 찾아야 한다.
 */
export async function searchDirectory(term: string, limit = 8): Promise<DirectoryEntry[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const { data, error } = await supabase
    .from('catholic_directory')
    .select(DIRECTORY_COLUMNS)
    .in('category', VISITOR_CATEGORIES)
    .or(
      `name.ilike.%${trimmed}%,address.ilike.%${trimmed}%,diocese.ilike.%${trimmed}%,` +
        `name_romanized.ilike.%${trimmed}%,address_romanized.ilike.%${trimmed}%`,
    )
    .limit(limit);

  if (error) {
    console.warn('searchDirectory 건너뜀:', error.message);
    return [];
  }
  return ((data ?? []) as CatholicDirectoryRow[]).map(toDirectoryEntry);
}

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
    .select(DIRECTORY_COLUMNS)
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
