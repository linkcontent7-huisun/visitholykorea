const EARTH_RADIUS_KM = 6371;
const WALK_SPEED_KM_PER_MIN = 4 / 60; // 시속 4km 도보 기준

/** 두 좌표 사이의 대권 거리(km). */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 거리(km)를 도보 소요 시간(분)으로 환산한다. 최소 1분. */
export function walkMinutes(distanceKm: number): number {
  return Math.max(1, Math.round(distanceKm / WALK_SPEED_KM_PER_MIN));
}

/** 카카오맵 길찾기 딥링크. 앱이 없으면 웹 지도로 열린다. */
export function kakaoDirectionsUrl(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}
