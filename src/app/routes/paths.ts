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
} as const;
