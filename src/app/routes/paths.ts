/**
 * 라우트 경로를 문자열로 흩어 놓지 않기 위한 단일 출처.
 * 경로를 바꿀 때 이 파일만 고치면 되고, 오타는 타입 검사에서 걸린다.
 */
export const paths = {
  home: '/',
  map: '/map',
  explore: '/explore',
  records: '/records',
  menu: '/menu',
  /** 계정 설정 — 더보기 맨 위 프로필 카드의 톱니바퀴 단추 (2026-09-18) */
  account: '/account',
  search: '/search',
  login: '/login',
  /** 마음 나침반 — 질문으로 성지를 찾아주는 화면 */
  compass: '/compass',
  siteDetail: (id: string) => `/sites/${id}`,
  siteDetailPattern: '/sites/:siteId',
  /** 이용약관 */
  terms: '/terms',
  /** 자주 묻는 질문 */
  faq: '/faq',
  /**
   * 고요 속으로 — 공모전 대표 기능. 관광지·지역 검색 → 예상 붐빔 → 비교적 한적한 성지.
   * 예전 「붐빔 피하기」(/alternatives)와 같은 기능이라 하나로 합쳤다(2026-09-14). 옛 주소는 리다이렉트.
   */
  quiet: '/quiet',
  alternatives: '/alternatives',
  /** 제출 범위에서 뺀 AI 가이드의 옛 진입 주소 — 안내 후 성지 찾기로 보낸다 */
  aiGuide: '/ai-guide',
  /** 개인정보 안내 */
  privacy: '/privacy',
  /** 축제 가는 김에 — 오늘 열리는 축제 옆의 성지를 권하는 화면(붐빔 피하기의 반대 방향) */
  festivals: '/festivals',
  /**
   * 시·도 랜딩 — 지자체·지역 기관에 건네는 링크(예: `/region/대전`).
   * 17개 시·도 전부에 같은 화면이 뜬다. 한 지역만 따로 만들지 않는다.
   */
  /** 여기에서 가장 가까운 성지·성당 — 현재 위치 기준 전체 목록 */
  nearby: '/nearby',
  region: (region: string) => `/region/${encodeURIComponent(region)}`,
  regionPattern: '/region/:region',
  /** 순례 코스 — 박해 사건·인물 축으로 성지를 잇는 길 */
  routes: '/routes',
  routeDetail: (slug: string) => `/routes/${slug}`,
  routeDetailPattern: '/routes/:routeSlug',
  /**
   * 관리자 콘솔 — 어디에도 링크하지 않는다(권한 있는 사람만 「더보기」에 뜬다).
   * 주소를 안다고 들어와지지도 않는다. 권한 판단은 DB 가 한다.
   */
  admin: '/admin',
  adminSite: (id: string) => `/admin/sites/${id}`,
  adminSitePattern: '/admin/sites/:siteId',
} as const;
