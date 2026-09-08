/**
 * 한글 → 로마자 변환 (국립국어원 국어의 로마자 표기법, 2000년 고시 기준).
 *
 * **왜 필요한가** — `catholic_directory`(전국 본당·공소 5,918건, 2026-09-07 검색·지역
 * 화면에 연결)는 한국천주교주교회의 주소록을 그대로 긁어온 한국어 원문뿐이다. 208곳
 * 성지처럼 사람이 확인한 영문 번역(`holy_site_translations`)을 5,918건 전부에 만드는
 * 것은 이번 세션 규모를 넘는다. 대신 **기계적으로 검증 가능한 규칙**(고시된 표기법)을
 * 그대로 적용해, 외국어 화면에서 최소한 읽고 검색할 수 있게 한다.
 *
 * **한계를 숨기지 않는다** — 이것은 발음 규칙 전부(음운 축약·경음화 등)를 구현한
 * 완벽한 변환기가 아니다. 표준 표기법의 핵심인 **음절 단위 기본 표기 + ㅇ 앞 연음**만
 * 처리한다. 겹받침(ㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ)의 연음, 자음동화(ㄴㄹ→ㄹㄹ 등), 고유명사의
 * 관용 표기(예: 이 → Lee)는 다루지 않는다 — 주소·기관명에서 드물고, 없는 규칙을
 * 있는 척 구현하는 것보다 정직하게 단순 표기를 쓰는 편이 낫다고 판단했다.
 * 한글이 아닌 문자(숫자·영문·기호)는 그대로 둔다.
 */

const HANGUL_START = 0xac00; // '가'
const HANGUL_END = 0xd7a3; // '힣'
const JUNGSEONG_COUNT = 21;
const JONGSEONG_COUNT = 28;

/** 초성 19자 — 유니코드 순서. */
const CHOSEONG = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
] as const;

/** 중성 21자 — 유니코드 순서. */
const JUNGSEONG = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
] as const;

/** 종성 28자(받침 없음 포함) — 음절 끝·자음 앞에서 실제로 나는 소리. */
const JONGSEONG_FINAL = [
  '', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k',
  'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't',
  'ng', 't', 't', 'k', 't', 'p', 't',
] as const;

/**
 * 다음 음절이 모음(초성 ㅇ)으로 시작할 때 받침이 그대로 다음 음절 초성으로 넘어간다(연음).
 * 이때 소리가 받침일 때와 달라지는 홑받침만 넣는다 — 겹받침·같은 소리는 생략해도
 * 결과가 같거나(예: ㄴ은 받침·초성 모두 "n"), 드물어서 생략이 더 안전하다.
 */
const JONGSEONG_LINK_ONSET: Partial<Record<number, string>> = {
  1: 'g', // ㄱ
  7: 'd', // ㄷ
  8: 'r', // ㄹ — 받침일 땐 "l", 연음되면 "r"(대표적인 표기법 규칙)
  17: 'b', // ㅂ
  19: 's', // ㅅ
  20: 'ss', // ㅆ
  22: 'j', // ㅈ
  23: 'ch', // ㅊ
  27: 'h', // ㅎ
};

function isHangulSyllable(code: number): boolean {
  return code >= HANGUL_START && code <= HANGUL_END;
}

/** 한 음절을 초성·중성·종성 인덱스로 나눈다. 한글 음절이 아니면 null. */
function decompose(char: string): { cho: number; jung: number; jong: number } | null {
  const code = char.charCodeAt(0);
  if (!isHangulSyllable(code)) return null;
  const offset = code - HANGUL_START;
  const jong = offset % JONGSEONG_COUNT;
  const jung = Math.floor(offset / JONGSEONG_COUNT) % JUNGSEONG_COUNT;
  const cho = Math.floor(offset / JONGSEONG_COUNT / JUNGSEONG_COUNT);
  return { cho, jung, jong };
}

/**
 * 한글 문자열을 로마자로 바꾼다. 한글이 아닌 문자(숫자·영문·공백·기호)는 그대로 둔다.
 * 단어(공백 기준) 첫 글자는 대문자로 — 고유명사·주소 표기 관례를 따른다.
 */
export function romanizeKorean(text: string): string {
  let result = '';

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]!;
    const here = decompose(char);

    if (!here) {
      result += char;
      continue;
    }

    const next = i + 1 < text.length ? decompose(text[i + 1]!) : null;
    const linksToNext = here.jong !== 0 && next !== null && next.cho === 11; // 11 = ㅇ

    result += CHOSEONG[here.cho];
    result += JUNGSEONG[here.jung];
    result += linksToNext
      ? (JONGSEONG_LINK_ONSET[here.jong] ?? JONGSEONG_FINAL[here.jong])
      : JONGSEONG_FINAL[here.jong];
  }

  // 단어 첫 글자 대문자화 — "mangudong 13" → "Mangudong 13"
  return result.replace(/(^|\s)([a-z])/g, (_, boundary: string, letter: string) => boundary + letter.toUpperCase());
}

/** 문자열에 로마자로 바꿀 한글이 하나라도 있는지. 이미 영문뿐이면 다시 돌릴 필요가 없다. */
export function hasHangul(text: string): boolean {
  for (let i = 0; i < text.length; i += 1) {
    if (isHangulSyllable(text.charCodeAt(i))) return true;
  }
  return false;
}
