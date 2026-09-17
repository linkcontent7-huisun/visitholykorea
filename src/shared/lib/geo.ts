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

/**
 * 거리(km)를 자동차 소요 시간(분)으로 환산한다. 최소 5분.
 *
 * 시내·고속도로가 섞인 도시 간 이동을 시속 60km 로 뭉뚱그린 어림값이다.
 * 길찾기 API 를 부르면 정확하겠지만, 목록 정렬에 필요한 것은
 * "1시간짜리인가 3시간짜리인가"라는 감이지 분 단위 정확도가 아니다.
 */
export function driveMinutes(distanceKm: number): number {
  return Math.max(5, Math.round(distanceKm)); // 시속 60km → km 수치가 곧 분
}

/**
 * 소요 시간(분)을 보는 사람의 언어로 표기한다 — 90분이 아니라 "1시간 30분".
 *
 * 시간·분 단위 낱말을 사전에 넣는 대신 Intl 에 맡긴다. 6개 국어 전부
 * 브라우저가 단위 표기를 알고 있고, 새 언어가 늘어도 손댈 곳이 없다.
 */
export function formatDuration(minutes: number, locale: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const fmt = (value: number, unit: 'hour' | 'minute') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }).format(value);
  if (h === 0) return fmt(m, 'minute');
  if (m === 0) return fmt(h, 'hour');
  return `${fmt(h, 'hour')} ${fmt(m, 'minute')}`;
}

/** 카카오맵 길찾기 딥링크. 앱이 없으면 웹 지도로 열린다. */
export function kakaoDirectionsUrl(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}

/**
 * 카카오맵에서 해당 장소를 지도 위에 띄우는 딥링크.
 *
 * 길찾기(`kakaoDirectionsUrl`)와 달리 경로를 잡지 않고 위치만 보여준다.
 * 주변 관광지처럼 "여기가 어디쯤인지"만 궁금한 경우에 쓴다.
 */
export function kakaoPlaceUrl(name: string, lat: number, lng: number): string {
  return `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
}

/**
 * 카카오맵 키워드 검색 결과 딥링크.
 *
 * `kakaoPlaceUrl` 은 좌표에 이름표만 붙인 핀이라 카카오가 실제로 아는 장소(리뷰·영업시간·
 * 전화번호가 있는 업체 정보)와 연결되지 않을 때가 많다. 이름으로 검색하면 카카오맵이
 * 가진 진짜 장소 정보로 연결될 가능성이 높다(사장님 지적, 2026-09-17 — "가는 김에
 * 둘러볼 곳" 카드를 누르면 정확한 장소 검색 결과가 나와야 한다).
 */
export function kakaoSearchUrl(name: string): string {
  return `https://map.kakao.com/link/search/${encodeURIComponent(name)}`;
}
