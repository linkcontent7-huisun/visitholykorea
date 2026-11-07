/** 탭 제목 규칙 — DocumentTitleSync 가 쓴다(컴포넌트 파일과 나눠야 빠른 새로고침이 된다). */
export const BRAND = 'Visit Holy Korea';
/** index.html 의 <title> 과 같아야 한다 */
export const HOME_TITLE = '비지트홀리코리아 Visit Holy Korea - 길 위에서 나를 만나는 성지순례';

/** 화면 제목(h1) → 탭 제목. 홈·빈 제목이면 null(기본 제목 유지). 테스트용으로 따로 낸다. */
export function titleFromHeading(
  heading: string | null | undefined,
  pathname: string,
): string | null {
  if (pathname === '/') return null;
  const text = (heading ?? '').replace(/\s+/g, ' ').trim();
  if (!text || text.startsWith(BRAND)) return null;
  return `${text} | ${BRAND}`;
}
