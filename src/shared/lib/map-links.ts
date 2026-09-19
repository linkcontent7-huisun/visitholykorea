/**
 * 지도 앱 길찾기 링크.
 *
 * 🔴 예전엔 구글·애플 지도도 함께 줬다(외국인 여행자용, 2026-09-07~08) — 국내 사용자에게는
 * 안 쓰인다는 사장님 지적(2026-09-19)으로 전부 뺐다. 이미 「주변 본당」 카드는 2026-09-17에
 * 같은 이유로 구글·애플을 뺀 전례가 있었는데(`PARISH_MAP_PROVIDERS`, 이제 삭제), 이번엔
 * 성지 상세의 길찾기 버튼을 포함해 코드 전체에서 뺐다 — 카카오맵·티맵·네이버지도만 남는다.
 * 외국인 방문자에게 필요한 대안(구글·애플)이 다시 필요해지면 이 파일을 참고해 되살릴 것.
 *
 * 그리고 가장 중요한 것은 지도가 아니라 **한국어 주소 그 자체**다.
 * 택시 기사에게 화면을 보여주는 것이 외국인에게는 가장 확실한 길찾기다.
 *
 * **한국어 화면 순서(2026-09-08, 실기기 테스트 피드백)** — 한국 사용자가
 * 실제로 쓰는 순서(카카오맵 → 티맵 → 네이버지도).
 */

export type MapProvider = 'kakao' | 'tmap' | 'naver';

export interface MapLink {
  provider: MapProvider;
  label: string;
  url: string;
  /** 이 앱이 한국에서 무엇을 잘하고 못하는지 */
  noteKey: 'kakaoNote' | 'tmapNote' | 'naverNote';
}

export interface Destination {
  name: string;
  lat: number;
  lng: number;
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
 * 길찾기 링크 묶음. 실사용 순(카카오맵 → 티맵 → 네이버지도)으로 고정한다 —
 * 구글·애플을 빼면서 언어별로 순서를 바꿀 이유도 같이 없어졌다. `preferKorean`
 * 은 브랜드명 라벨(카카오맵/KakaoMap 등)에만 쓴다.
 */
export function buildMapLinks(destination: Destination, preferKorean: boolean): MapLink[] {
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

  return [kakao, tmap, naver];
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
