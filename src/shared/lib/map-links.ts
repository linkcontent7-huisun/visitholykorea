/**
 * 지도 앱 길찾기 링크.
 *
 * 한국에서 외국인 여행자가 겪는 실제 문제를 전제로 만들었다.
 *
 *  - 구글 지도는 한국에서 **자동차 길찾기가 나오지 않는다.** 국내 지도 데이터 반출 규제 때문이다.
 *    대중교통·도보는 대체로 동작하고, 위치를 찾아 보는 데는 문제가 없다.
 *  - 카카오맵·티맵·네이버지도는 한국에서 가장 정확하지만 **외국인은 앱이 깔려 있지 않다.**
 *  - 그래서 한 곳으로 몰지 않고 **선택지를 나란히 주고, 각각 무엇을 잘하는지 밝힌다.**
 *
 * 그리고 가장 중요한 것은 지도가 아니라 **한국어 주소 그 자체**다.
 * 택시 기사에게 화면을 보여주는 것이 외국인에게는 가장 확실한 길찾기다.
 *
 * **한국어 화면 순서(2026-09-08, 실기기 테스트 피드백)** — 한국 사용자가
 * 실제로 쓰는 순서(카카오맵 → 티맵 → 네이버지도)를 앞에 두고, 구글을 마지막에
 * 둔다. 애플 지도는 그 뒤에 남겨 둔다 — iPhone 은 구글 지도로도 대부분
 * 커버되지만, 애플 지도를 특별히 원하는 사람까지 막지는 않는다.
 */

export type MapProvider = 'google' | 'apple' | 'kakao' | 'tmap' | 'naver';

export interface MapLink {
  provider: MapProvider;
  label: string;
  url: string;
  /** 이 앱이 한국에서 무엇을 잘하고 못하는지 */
  noteKey: 'googleNote' | 'appleNote' | 'kakaoNote' | 'tmapNote' | 'naverNote';
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
 * 티맵 — 한국 운전자가 가장 많이 쓰는 내비게이션.
 * SK텔레콤이 공개한 딥링크 스킴만 있고 웹 대체 주소가 없다 — 앱이 없으면
 * 아무 반응이 없을 수 있다. 그래도 실제 운전자 비중이 커서 선택지에 넣는다.
 */
function tmapUrl({ name, lat, lng }: Destination): string {
  return `tmap://route?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;
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
 * 한국어 화면에서는 카카오·티맵·네이버(실사용 순)를 앞에 둔다 —
 * 실제로 쓸 수 있는 것이 먼저 와야 한다.
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
  // 브랜드명이라 번역하지 않는다 — 한국어 화면 밖에서는 로마자 표기로 통일한다.
  const kakao: MapLink = {
    provider: 'kakao',
    label: preferKorean ? '카카오맵' : 'KakaoMap',
    url: kakaoUrl(destination),
    noteKey: 'kakaoNote',
  };
  const tmap: MapLink = {
    provider: 'tmap',
    label: preferKorean ? 'T맵' : 'T map',
    url: tmapUrl(destination),
    noteKey: 'tmapNote',
  };
  const naver: MapLink = {
    provider: 'naver',
    label: preferKorean ? '네이버지도' : 'Naver Map',
    url: naverUrl(destination),
    noteKey: 'naverNote',
  };

  return preferKorean
    ? [kakao, tmap, naver, google, apple]
    : [google, apple, kakao, tmap, naver];
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
