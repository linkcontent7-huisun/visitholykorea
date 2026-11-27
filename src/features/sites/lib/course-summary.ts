/**
 * 두루누비 설명에는 `<br>` 같은 꼬리표가 글자 그대로 들어 있다(점검 B 고장 2, 2026-11-22).
 * 줄바꿈 꼬리표는 줄바꿈으로, 나머지 꼬리표는 지운다. 화면에 HTML 로 넣지 않는다.
 */
export function plainCourseSummary(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\n{2,}/g, '\n')
    .trim();
}
