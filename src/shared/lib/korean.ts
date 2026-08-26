/**
 * 한국어 조사 처리.
 *
 * **왜 필요한가** — 코스 카드 문구처럼 성지 이름을 문장에 끼워 넣는 곳에서
 * "나주 순교자 기념성당**로**" 같은 문장이 그대로 화면에 나갔다.
 * 종교 성지를 다루는 앱이라 문구 하나가 신뢰에 직접 영향을 준다.
 *
 * 이름은 DB에서 오므로 하드코딩으로 막을 수 없고, 조사를 계산해야 한다.
 */

const HANGUL_START = 0xac00; // '가'
const HANGUL_END = 0xd7a3; // '힣'
const JONGSEONG_COUNT = 28; // 받침 없음(0) + 27종

/**
 * 마지막 글자의 받침 코드. 0이면 받침 없음, 8이면 'ㄹ'.
 * 한글 음절로 끝나지 않으면 `null`.
 */
export function finalJongseong(word: string): number | null {
  const last = word.trimEnd().slice(-1);
  if (!last) return null;

  const code = last.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return null;

  return (code - HANGUL_START) % JONGSEONG_COUNT;
}

/**
 * 방향 조사 — "…성지**로**" / "…성당**으로**".
 *
 * 받침이 없거나 'ㄹ' 받침이면 "로", 그 밖의 받침이면 "으로".
 * 한글로 끝나지 않으면(영문·숫자 등) "로"를 쓴다 — 외래어 표기에서 더 자연스럽다.
 */
export function directionParticle(word: string): '로' | '으로' {
  const jong = finalJongseong(word);
  if (jong === null) return '로';
  return jong === 0 || jong === 8 ? '로' : '으로';
}

/** "성지로" / "성당으로" 처럼 조사를 붙여 돌려준다. */
export function withDirection(word: string): string {
  return `${word}${directionParticle(word)}`;
}
