/**
 * 시·도 목록과 대략적 중심 좌표.
 *
 * **왜 shared 에 있나** — 원래 「마음 나침반」 퀴즈 안에만 있었다. 그런데 출발지는
 * 퀴즈 한 번의 답이 아니라 **그 사람이 어디 사는가**에 가깝다. 홈·탐색·지도가 모두
 * 같은 출발지를 기준으로 거리를 재야 해서 설정으로 올렸고, 좌표도 함께 옮겼다.
 *
 * 좌표는 행정구역 정밀 경계가 아니라 시청·도청 기준 근사치다. 거리 **정렬**에 쓰는
 * 값이라 이 정도로 충분하다. 실제 이동거리를 표시하는 곳에는 쓰지 않는다.
 */

export const REGIONS = [
  '서울',
  '부산',
  '대구',
  '인천',
  '광주',
  '대전',
  '울산',
  '세종',
  '경기',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_COORDS: Record<Region, { lat: number; lng: number }> = {
  서울: { lat: 37.5665, lng: 126.978 },
  부산: { lat: 35.1796, lng: 129.0756 },
  대구: { lat: 35.8714, lng: 128.6014 },
  인천: { lat: 37.4563, lng: 126.7052 },
  광주: { lat: 35.1595, lng: 126.8526 },
  대전: { lat: 36.3504, lng: 127.3845 },
  울산: { lat: 35.5384, lng: 129.3114 },
  세종: { lat: 36.48, lng: 127.289 },
  경기: { lat: 37.4138, lng: 127.5183 },
  강원: { lat: 37.8228, lng: 128.1555 },
  충북: { lat: 36.6357, lng: 127.4917 },
  충남: { lat: 36.5184, lng: 126.8 },
  전북: { lat: 35.7175, lng: 127.153 },
  전남: { lat: 34.8161, lng: 126.463 },
  경북: { lat: 36.4919, lng: 128.8889 },
  경남: { lat: 35.4606, lng: 128.2132 },
  제주: { lat: 33.4996, lng: 126.5312 },
};

/** 저장된 문자열이 실제 시·도인지. localStorage 값은 믿을 수 없다. */
export function isRegion(value: unknown): value is Region {
  return typeof value === 'string' && (REGIONS as readonly string[]).includes(value);
}

/** 시·도 이름 → 좌표. 모르는 값이면 null. */
export function regionCoords(region: string | null | undefined) {
  return isRegion(region) ? REGION_COORDS[region] : null;
}
