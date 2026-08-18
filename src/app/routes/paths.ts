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
  search: '/search',
  login: '/login',
  /** 마음 나침반 — 질문으로 성지를 찾아주는 화면 */
  compass: '/compass',
  siteDetail: (id: string) => `/sites/${id}`,
  siteDetailPattern: '/sites/:siteId',
  /** 순례 코스 — 박해 사건·인물 축으로 성지를 잇는 길 */
  routes: '/routes',
  routeDetail: (slug: string) => `/routes/${slug}`,
  routeDetailPattern: '/routes/:routeSlug',
} as const;
