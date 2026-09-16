/**
 * 사진이 아직 없는 성지에 보여줄 임시 이미지.
 *
 * 2026-09-12 기준 208곳 중 155곳이 사진이 없어 목록이 회색 문양으로만 채워졌다.
 * 사장님이 만든 임시 이미지 6장("곧 현장 사진을 올릴 예정" 문구가 박혀 있어
 * 진짜 사진으로 오해되지 않는다)을 빈자리에 돌려 쓴다.
 *
 * 왜 무작위가 아니라 이름 해시인가 — 새로고침할 때마다 사진이 바뀌면
 * "아까 본 그 성지"를 눈으로 못 찾는다. 같은 성지는 늘 같은 임시 사진이어야 한다.
 *
 * 이 이미지는 DB 의 image_url 에 넣지 않는다. 관리자 콘솔의 "사진 없음" 대기열은
 * DB 값으로 세므로, 임시 이미지가 있어도 그 성지는 계속 "채울 곳"으로 남는다.
 */

import type { Language } from '@/shared/i18n/dictionary';

export const PLACEHOLDER_COUNT = 6;

/** 문자열을 0 이상의 정수로 — 32비트 FNV-1a. 암호용이 아니라 고르게 흩기만 하면 된다. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 이미지 안에 박힌 문구는 번역이 안 되므로 언어마다 같은 6장면을 따로 둔다
 * (`public/placeholders/<언어>/`). 2026-09-15 스페인어 화면에 한국어 문구가
 * 그대로 보이던 문제의 해결 — 사장님이 5개 언어 판을 만들어 주셨다(2026-09-16).
 * 폴더가 없는 언어가 생기면 한국어 판으로 떨어진다.
 */
const PLACEHOLDER_LANGUAGES: readonly Language[] = ['ko', 'en', 'es', 'fr', 'pt', 'it'];

/** 성지 이름(또는 id)에 고정 배정된 임시 이미지 경로. 같은 성지는 언어가 바뀌어도 같은 장면. */
export function placeholderImageFor(key: string, language: Language = 'ko'): string {
  const n = (hash(key) % PLACEHOLDER_COUNT) + 1;
  const lang = PLACEHOLDER_LANGUAGES.includes(language) ? language : 'ko';
  return `/placeholders/${lang}/site-placeholder-${n}.webp`;
}
