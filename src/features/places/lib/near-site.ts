import { haversineKm } from '@/shared/lib/geo';

/** 성지 상세에 붙일 공개 장소 — 좌표(주소록에서 고른 곳)나 주소 글자(직접 쓴 곳) 중 있는 것으로 고른다. */
export interface PlaceForMatch {
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export const NEAR_SITE_KM = 10;

/**
 * 주소에서 「시·군·구」 한 덩어리를 뽑는다. 특별시·광역시는 범위가 너무 넓어
 * 구가 있으면 구를 쓴다(「서울특별시 종로구」 → 「종로구」, 「서귀포시 호근동」 → 「서귀포시」).
 * 도·특별자치도는 건너뛴다.
 */
export function localityOf(address: string | null | undefined): string | null {
  if (!address) return null;
  const tokens = address.split(/\s+/).filter((t) => !/^\d/.test(t));
  const gu = tokens.find((t) => /.+구$/.test(t));
  const city = tokens.find((t) => /.+(시|군)$/.test(t) && !/(특별시|광역시)$/.test(t));
  const metro = tokens.find((t) => /(특별시|광역시)$/.test(t));
  if (metro) return gu ?? metro;
  return city ?? gu ?? null;
}

/** 11/2 사장님 결정(권장안): 좌표가 있으면 10km 안, 없으면 주소의 시·군·구가 성지와 같을 때. */
export function isNearSite(
  place: PlaceForMatch,
  site: { lat: number | null; lng: number | null; location: string },
): boolean {
  if (place.lat != null && place.lng != null && site.lat != null && site.lng != null) {
    return haversineKm(site.lat, site.lng, place.lat, place.lng) <= NEAR_SITE_KM;
  }
  const a = localityOf(place.address);
  const b = localityOf(site.location);
  return a != null && a === b;
}
