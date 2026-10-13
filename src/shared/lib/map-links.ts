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
 *
 * **2026-10-13 — 세 앱 모두 좌표로 보낸다(사장님: "잘못된 곳으로 안내하면 안 된다").**
 * 네이버지도를 이름 검색으로 보내던 것이 문제였다 — 「전라 감영」「석전」처럼 흔한
 * 이름은 엉뚱한 곳이 먼저 나온다. 휴대폰에서는 네이버 공식 앱 스킴(`nmap://route/…`,
 * 위도·경도·이름)으로 열고, 안드로이드는 인텐트 URL 이라 앱이 없으면 웹 지도로
 * 넘어간다. 티맵도 안드로이드에서는 인텐트 URL 로 바꿔 앱이 없으면 설치 화면이 뜬다
 * (전에는 아무 반응이 없었다). 데스크톱은 앱 스킴이 없으므로 웹 검색을 그대로 둔다.
 */

export type MapProvider = 'kakao' | 'tmap' | 'naver';

export interface MapLink {
  provider: MapProvider;
  label: string;
  /** `<a href>` 에 넣을 주소. 안드로이드 인텐트·티맵 스킴·웹 주소 중 하나다. */
  url: string;
  /**
   * iOS 전용: 먼저 이 앱 스킴을 열어 보고, 앱이 없어 화면이 그대로면 `url`(웹)로 간다.
   * iOS 사파리는 설치 안 된 스킴을 `href` 로 열면 "주소가 잘못됐다"는 경고를 띄우므로
   * 호출부가 클릭 핸들러에서 타이머로 분기한다(네이버 공식 가이드 방식).
   */
  appUrl?: string;
  /** 이 앱이 한국에서 무엇을 잘하고 못하는지 */
  noteKey: 'kakaoNote' | 'tmapNote' | 'naverNote';
}

export interface Destination {
  name: string;
  lat: number;
  lng: number;
}

export type Platform = 'android' | 'ios' | 'other';

/** 앱 스킴을 어떻게 열지 정하려고만 쓴다. 서버·테스트(navigator 없음)에서는 'other'. */
export function detectPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  return 'other';
}

/** 네이버 공식 스킴은 호출한 웹 주소를 appname 으로 요구한다. */
const APP_NAME = 'https://visitholykorea.com';

/** 카카오맵 — 한국에서 가장 정확한 길찾기. 이 주소 하나로 웹·앱 모두 열린다. */
function kakaoUrl({ name, lat, lng }: Destination): string {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}

/**
 * 티맵 — 한국 운전자가 가장 많이 쓰는 내비게이션. SK텔레콤이 공개한 딥링크 스킴만
 * 있고 웹 대체 주소가 없다. 안드로이드는 인텐트 URL 로 감싸 앱이 없으면 Play 스토어가
 * 뜨게 한다. iOS·데스크톱은 스킴 그대로(없으면 반응이 없거나 경고가 뜬다).
 */
function tmapUrl({ name, lat, lng }: Destination, platform: Platform): string {
  const query = `route?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;
  if (platform === 'android') {
    return `intent://${query}#Intent;scheme=tmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.skt.tmap;end`;
  }
  return `tmap://${query}`;
}

/** 네이버지도 웹 — 이름 검색. 좌표를 못 받는 데스크톱과, 앱이 없을 때의 대체 경로다. */
function naverWebUrl({ name }: Destination): string {
  return `https://map.naver.com/p/search/${encodeURIComponent(name)}`;
}

/**
 * 네이버지도 앱 — 대중교통 길찾기(`route/public`), 목적지는 위도·경도·이름.
 * 공식 가이드: https://guide.ncloud-docs.com/docs/maps-url-scheme
 */
function naverAppQuery({ name, lat, lng }: Destination): string {
  return `route/public?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=${encodeURIComponent(APP_NAME)}`;
}

function naverLink(destination: Destination, platform: Platform): Pick<MapLink, 'url' | 'appUrl'> {
  const web = naverWebUrl(destination);
  if (platform === 'android') {
    // 앱이 없으면 S.browser_fallback_url 로 — 스토어 대신 웹 지도로 보낸다
    return {
      url: `intent://${naverAppQuery(destination)}#Intent;scheme=nmap;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.nhn.android.nmap;S.browser_fallback_url=${encodeURIComponent(web)};end`,
    };
  }
  if (platform === 'ios') {
    return { url: web, appUrl: `nmap://${naverAppQuery(destination)}` };
  }
  return { url: web };
}

/**
 * 길찾기 링크 묶음. 실사용 순(카카오맵 → 티맵 → 네이버지도)으로 고정한다 —
 * 구글·애플을 빼면서 언어별로 순서를 바꿀 이유도 같이 없어졌다. `preferKorean`
 * 은 브랜드명 라벨(카카오맵/KakaoMap 등)에만 쓴다.
 */
export function buildMapLinks(
  destination: Destination,
  preferKorean: boolean,
  platform: Platform = detectPlatform(),
): MapLink[] {
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
    url: tmapUrl(destination, platform),
    noteKey: 'tmapNote',
  };
  const naver: MapLink = {
    provider: 'naver',
    label: preferKorean ? '네이버지도' : 'Naver Map',
    ...naverLink(destination, platform),
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
