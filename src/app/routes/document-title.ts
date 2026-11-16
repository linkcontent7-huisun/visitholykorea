/** 탭 제목 규칙 — DocumentTitleSync 가 쓴다(컴포넌트 파일과 나눠야 빠른 새로고침이 된다). */
export const BRAND = 'Visit Holy Korea';
/** index.html 의 <title> 과 같아야 한다 */
export const HOME_TITLE =
  '성지순례 - 한국 천주교 성지 200여 곳 지도·미사·순교 이야기 | 비지트홀리코리아';
/** 성지 상세 탭 제목 꼬리 — '성지순례' 검색어를 노린다(2026-11-16 사장님 결정, B안). scripts/lib/seo-pages.ts 와 같아야 한다 */
export const SITE_TITLE_SUFFIX = '천주교 성지순례 · 비지트홀리코리아';

/** 화면 제목(h1) → 탭 제목. 홈·빈 제목이면 null(기본 제목 유지). 테스트용으로 따로 낸다. */
export function titleFromHeading(
  heading: string | null | undefined,
  pathname: string,
): string | null {
  if (pathname === '/') return null;
  const text = (heading ?? '').replace(/\s+/g, ' ').trim();
  if (!text || text.startsWith(BRAND) || text.startsWith('성지순례 - ')) return null;
  const suffix = pathname.startsWith('/sites/') ? SITE_TITLE_SUFFIX : BRAND;
  return `${text} | ${suffix}`;
}
