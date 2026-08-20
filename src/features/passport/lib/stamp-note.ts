/**
 * 방문 한 줄 기록의 정규화.
 *
 * "한 줄"이라는 약속을 코드에서도 지킨다 — 줄바꿈은 공백으로 접고,
 * 길이는 DB 제약(120자)과 같은 값으로 자른다. 화면과 DB 가 서로 다른
 * 기준을 갖는 순간부터 저장 실패가 사용자 탓처럼 보이기 시작한다.
 */

/** DB 체크 제약과 같은 값. 마이그레이션 20260819000000 참조. */
export const NOTE_MAX_LENGTH = 120;

/** 입력을 저장 가능한 형태로 다듬는다. 내용이 없으면 null. */
export function normalizeNote(raw: string): string | null {
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return null;
  return collapsed.slice(0, NOTE_MAX_LENGTH);
}
