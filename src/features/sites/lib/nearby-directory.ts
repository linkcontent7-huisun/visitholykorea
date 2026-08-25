/**
 * 성지 주변 본당·피정의집 찾기의 순수 계산부.
 *
 * Supabase(PostgREST)는 좌표 반경 검색을 못 하므로, 위경도 사각 범위로
 * 좁혀 받아온 뒤 실제 거리로 거르고 정렬한다. 5,918건을 통째로 받지 않기
 * 위한 장치다. 위도 1도 ≈ 111km, 경도 1도는 한국 위도에서 ≈ 88km.
 */

import { haversineKm } from '@/shared/lib/geo';
import type { CatholicDirectoryRow } from '@/shared/types/database';

export interface DirectoryBBox {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

/** 반경(km)을 덮는 위경도 사각 범위. DB 질의를 좁히는 1차 필터다. */
export function bboxAround(lat: number, lng: number, radiusKm: number): DirectoryBBox {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / 88;
  return {
    latMin: lat - latDelta,
    latMax: lat + latDelta,
    lngMin: lng - lngDelta,
    lngMax: lng + lngDelta,
  };
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  address: string | null;
  distanceKm: number;
}

/** 사각 범위로 받아온 행을 실제 거리로 걸러 가까운 순으로 낸다. */
export function rankNearby(
  lat: number,
  lng: number,
  rows: CatholicDirectoryRow[],
  radiusKm: number,
  limit: number,
): NearbyPlace[] {
  return rows
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      phone: r.phone,
      address: r.address,
      distanceKm: haversineKm(lat, lng, r.lat!, r.lng!),
    }))
    .filter((p) => p.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

/** 화면에 그대로 쓰는 거리 문구. 1km 미만은 미터로. */
export function formatDistanceKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}
