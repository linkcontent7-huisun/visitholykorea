/**
 * 지도 앱 길찾기 링크.
 *
 * 한국에서 외국인 여행자가 겪는 실제 문제를 전제로 만들었다.
 *
 *  - 구글 지도는 한국에서 **자동차 길찾기가 나오지 않는다.** 국내 지도 데이터 반출 규제 때문이다.
 *    대중교통·도보는 대체로 동작하고, 위치를 찾아 보는 데는 문제가 없다.
 *  - 카카오맵·네이버지도는 한국에서 가장 정확하지만 **외국인은 앱이 깔려 있지 않다.**
 *  - 그래서 한 곳으로 몰지 않고 **선택지를 나란히 주고, 각각 무엇을 잘하는지 밝힌다.**
 *
 * 그리고 가장 중요한 것은 지도가 아니라 **한국어 주소 그 자체**다.
 * 택시 기사에게 화면을 보여주는 것이 외국인에게는 가장 확실한 길찾기다.
 */

export type MapProvider = 'google' | 'apple' | 'kakao' | 'naver';

export interface MapLink {
  provider: MapProvider;
  label: string;
  url: string;
  /** 이 앱이 한국에서 무엇을 잘하고 못하는지 */
  noteKey: 'googleNote' | 'appleNote' | 'kakaoNote' | 'naverNote';
}

export interface Destination {
  name: string;
  lat: number;
  lng: number;
}

/**
 * 구글 지도 — 외국인의 기본값.
 * 공식 URL 스킴(`api=1`)이라 앱이 있으면 앱으로, 없으면 웹으로 열린다.
 */
function googleUrl({ lat, lng }: Destination): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
}

/** 애플 지도 — iOS 기본 지도 앱 */
function appleUrl({ name, lat, lng }: Destination): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(name)}`;
}

/** 카카오맵 — 한국에서 가장 정확한 길찾기 */
function kakaoUrl({ name, lat, lng }: Destination): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}

/**
 * 네이버지도 — 대중교통에 강하다.
 * 좌표 기반 길찾기 URL은 형식이 자주 바뀌어, 안정적인 검색 링크로 보낸다.
 */
function naverUrl({ name }: Destination): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(name)}`;
}

/**
 * 길찾기 링크 묶음.
 *
 * 순서가 곧 추천 순서다. 외국어 화면에서는 구글·애플을 앞에,
 * 한국어 화면에서는 카카오·네이버를 앞에 둔다 — 실제로 쓸 수 있는 것이 먼저 와야 한다.
 */
export function buildMapLinks(destination: Destination, preferKorean: boolean): MapLink[] {
  const google: MapLink = {
    provider: 'google',
    label: 'Google Maps',
    url: googleUrl(destination),
    noteKey: 'googleNote',
  };
  const apple: MapLink = {
    provider: 'apple',
    label: 'Apple Maps',
    url: appleUrl(destination),
    noteKey: 'appleNote',
  };
  const kakao: MapLink = {
    provider: 'kakao',
    label: '카카오맵',
    url: kakaoUrl(destination),
    noteKey: 'kakaoNote',
  };
  const naver: MapLink = {
    provider: 'naver',
    label: '네이버지도',
    url: naverUrl(destination),
    noteKey: 'naverNote',
  };

  return preferKorean ? [kakao, naver, google, apple] : [google, apple, kakao, naver];
}

/** 좌표를 보기 좋게. 지도 앱에 직접 붙여넣을 수 있는 형식이다. */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * 클립보드 복사. 지원하지 않는 환경에서는 false 를 돌려주고,
 * 호출부가 "길게 눌러 복사하세요" 같은 대안을 보여준다.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
