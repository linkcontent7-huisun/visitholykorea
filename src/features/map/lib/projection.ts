/**
 * 위경도 → 조망 지도 좌표.
 *
 * **왜 SDK 를 쓰지 않는가** — 이 지도가 하는 일은 길찾기가 아니라
 * "208곳 중 내가 어디까지 왔나"를 한 화면에 보여주는 것이다(ADR 0003 의 본 구현과 별개).
 * 그 목적에는 확대·축소·타일이 필요 없고, 오히려 방해가 된다.
 * Gronze 의 전체 순례길 지도도 인터랙티브 지도가 아니라 도식 지도다.
 *
 * 덕분에 외부 스크립트·API 키·네트워크 없이 그려진다. 저신호 환경에서도 뜨고,
 * 카카오맵 SDK 로딩 실패 시 폴백으로도 쓸 수 있다.
 */

/**
 * 지도에 담을 범위.
 * 제주(남단 33.1)부터 강원 북단(38.6)까지, 서해 백령도(124.6)부터 동해안(129.6)까지.
 * 실제 성지 좌표가 이 밖으로 나가면 데이터 오류이므로 숨기지 않고 따로 센다.
 */
export const KOREA_BOUNDS = {
  minLat: 32.9,
  maxLat: 38.7,
  minLng: 124.5,
  maxLng: 130.0,
} as const;

/**
 * 경도 보정 계수.
 *
 * 위도가 올라갈수록 경도 1도의 실제 거리가 짧아진다(적도에서 111km, 극에서 0).
 * 보정하지 않고 위경도를 그대로 x·y 에 넣으면 **동서로 늘어난 한반도**가 나온다.
 * 우리 범위의 중간 위도(약 35.8도)로 한 번만 보정한다 — 이 정도 범위에서는 충분하다.
 */
const LNG_SCALE = Math.cos((((KOREA_BOUNDS.minLat + KOREA_BOUNDS.maxLat) / 2) * Math.PI) / 180);

const LAT_SPAN = KOREA_BOUNDS.maxLat - KOREA_BOUNDS.minLat;
const LNG_SPAN = (KOREA_BOUNDS.maxLng - KOREA_BOUNDS.minLng) * LNG_SCALE;

/**
 * 그림 영역의 가로세로 비.
 * 세로가 더 길다(한반도는 남북으로 길다). 컴포넌트의 viewBox 가 이 값을 따른다.
 */
export const MAP_ASPECT = LNG_SPAN / LAT_SPAN;

export interface MapPoint {
  x: number;
  y: number;
}

export interface MapSize {
  width: number;
  height: number;
}

/**
 * 위경도를 지도 좌표로 옮긴다.
 *
 * 좌표가 없거나 범위 밖이면 **null 을 준다.** 범위 밖을 가장자리에 붙여 놓으면
 * 잘못된 좌표가 정상인 척 찍혀서 데이터 오류를 놓치게 된다.
 */
export function projectToMap(
  lat: number | null,
  lng: number | null,
  size: MapSize,
): MapPoint | null {
  if (lat == null || lng == null) return null;
  if (lat < KOREA_BOUNDS.minLat || lat > KOREA_BOUNDS.maxLat) return null;
  if (lng < KOREA_BOUNDS.minLng || lng > KOREA_BOUNDS.maxLng) return null;

  const x = ((lng - KOREA_BOUNDS.minLng) * LNG_SCALE * size.width) / LNG_SPAN;
  // 위도는 북쪽이 클수록 화면에서는 위(작은 y)로 가야 한다
  const y = ((KOREA_BOUNDS.maxLat - lat) * size.height) / LAT_SPAN;

  return { x, y };
}

/** 겹친 핀을 살짝 흩어 놓기 위한 값. 같은 성지는 항상 같은 값을 받아야 화면이 떨리지 않는다. */
export function jitterFor(id: string, amount: number): MapPoint {
  // 문자열을 정수 해시로. 난수를 쓰면 리렌더마다 핀이 튄다.
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
  const radius = (Math.abs(hash >> 9) % 100) / 100;
  return { x: Math.cos(angle) * radius * amount, y: Math.sin(angle) * radius * amount };
}
