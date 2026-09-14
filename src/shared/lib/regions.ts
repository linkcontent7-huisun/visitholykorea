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

/** 관광공사 빅데이터 API가 요구하는 시·도 행정코드. 시·군·구 코드는 주소 이름으로 응답과 맞춘다. */
export const REGION_AREA_CODES: Record<Region, string> = {
  서울: '11',
  부산: '26',
  대구: '27',
  인천: '28',
  광주: '29',
  대전: '30',
  울산: '31',
  세종: '36',
  경기: '41',
  강원: '42',
  충북: '43',
  충남: '44',
  전북: '45',
  전남: '46',
  경북: '47',
  경남: '48',
  제주: '50',
};

/**
 * 주소의 긴 시·도 이름 → 짧은 이름. DB 주소는 「충청남도」「경상북도」처럼 긴 이름이 절반이라
 * (2026-09-14 실측: 208곳 중 57곳) 짧은 이름 포함 검사만으로는 못 찾는다.
 */
const REGION_ALIASES: Record<string, Region> = {
  충청남도: '충남',
  충청북도: '충북',
  전라남도: '전남',
  전라북도: '전북',
  전북특별자치도: '전북',
  경상남도: '경남',
  경상북도: '경북',
};

/** 주소가 속한 시·도(짧은 이름). 교구명은 행정구역이 아니므로 쓰지 않는다. */
export function regionOfAddress(address: string): Region | null {
  const alias = Object.keys(REGION_ALIASES).find((name) => address.startsWith(name));
  if (alias) return REGION_ALIASES[alias] ?? null;
  return REGIONS.find((name) => address.includes(name)) ?? null;
}

/** 성지 주소 첫 행정구역으로 시·도 코드를 찾는다. */
export function areaCodeForAddress(address: string): string | null {
  const region = regionOfAddress(address);
  return region ? REGION_AREA_CODES[region] : null;
}

/** 주소에서 시·군·구 이름(「서산시」「강동구」). 첫 단어(시·도)는 뺀다 — 「서울시」가 시·군·구로 잡히지 않게. */
export function districtOfAddress(address: string): string | null {
  const words = address.replace(/[(),]/g, ' ').trim().split(/\s+/);
  return words.slice(1).find((word) => /^[가-힣]+(시|군|구)$/.test(word)) ?? null;
}

/** 저장된 문자열이 실제 시·도인지. localStorage 값은 믿을 수 없다. */
export function isRegion(value: unknown): value is Region {
  return typeof value === 'string' && (REGIONS as readonly string[]).includes(value);
}

/** 시·도 이름 → 좌표. 모르는 값이면 null. */
export function regionCoords(region: string | null | undefined) {
  return isRegion(region) ? REGION_COORDS[region] : null;
}
