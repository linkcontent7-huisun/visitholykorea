/**
 * PostgREST `or()` 필터 문자열을 안전하게 만든다.
 *
 * `or()` 는 `name.ilike.%명동%,location.ilike.%명동%` 처럼 **문자열 하나**를 받고,
 * 쉼표·괄호·마침표가 문법 구분자다. 사용자가 친 검색어를 그대로 넣으면
 * 「명동, 서울」은 400 오류가 나고, 「x%,id.eq.…」처럼 조건을 끼워 넣을 수도 있었다
 * (2026-11-14 운영 DB 실측, 이슈 #103).
 *
 * 값을 큰따옴표로 감싸면 그 안의 쉼표·괄호는 글자로 취급된다. 따옴표 안에서 의미가 있는
 * `\` 와 `"` 만 역슬래시로 이스케이프한다 (PostgREST 문서 "Reserved characters").
 */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** `column.ilike."%term%"` — 부분 일치 조건 하나. 여러 개를 쉼표로 이어 `or()` 에 넘긴다. */
export function ilikeContains(column: string, term: string): string {
  return `${column}.ilike.${quoteFilterValue(`%${term}%`)}`;
}
