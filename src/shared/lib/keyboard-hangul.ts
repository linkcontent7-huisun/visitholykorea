/**
 * 영문 자판으로 친 한글을 되돌린다 — 「audehdtjdekd」 → 「명동성당」.
 *
 * 한/영 전환을 잊고 두벌식 자판 위치 그대로 친 글자를 한글 음절로 다시 조립한다.
 * 고령 순례자가 자주 하는 실수라서(2026-10-14 사장님) 미카엘 챗봇과 성지 찾기 양쪽에서 쓴다.
 *
 * ⚠️ 같은 파일이 `supabase/functions/_shared/keyboard-hangul.ts` 에 복사돼 있다(Edge Function 은
 * src 를 못 읽는다). 고치면 둘 다 고친다 — 두 파일이 같은지 테스트가 확인한다.
 */

const KEY_TO_JAMO: Record<string, string> = {
  r: 'ㄱ',
  R: 'ㄲ',
  s: 'ㄴ',
  e: 'ㄷ',
  E: 'ㄸ',
  f: 'ㄹ',
  a: 'ㅁ',
  q: 'ㅂ',
  Q: 'ㅃ',
  t: 'ㅅ',
  T: 'ㅆ',
  d: 'ㅇ',
  w: 'ㅈ',
  W: 'ㅉ',
  c: 'ㅊ',
  z: 'ㅋ',
  x: 'ㅌ',
  v: 'ㅍ',
  g: 'ㅎ',
  k: 'ㅏ',
  o: 'ㅐ',
  O: 'ㅒ',
  i: 'ㅑ',
  j: 'ㅓ',
  p: 'ㅔ',
  P: 'ㅖ',
  u: 'ㅕ',
  h: 'ㅗ',
  y: 'ㅛ',
  n: 'ㅜ',
  b: 'ㅠ',
  m: 'ㅡ',
  l: 'ㅣ',
};

const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const JONG = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

const VOWEL_PAIR: Record<string, string> = {
  ㅗㅏ: 'ㅘ',
  ㅗㅐ: 'ㅙ',
  ㅗㅣ: 'ㅚ',
  ㅜㅓ: 'ㅝ',
  ㅜㅔ: 'ㅞ',
  ㅜㅣ: 'ㅟ',
  ㅡㅣ: 'ㅢ',
};
const FINAL_PAIR: Record<string, string> = {
  ㄱㅅ: 'ㄳ',
  ㄴㅈ: 'ㄵ',
  ㄴㅎ: 'ㄶ',
  ㄹㄱ: 'ㄺ',
  ㄹㅁ: 'ㄻ',
  ㄹㅂ: 'ㄼ',
  ㄹㅅ: 'ㄽ',
  ㄹㅌ: 'ㄾ',
  ㄹㅍ: 'ㄿ',
  ㄹㅎ: 'ㅀ',
  ㅂㅅ: 'ㅄ',
};
const FINAL_SPLIT: Record<string, [string, string]> = Object.fromEntries(
  Object.entries(FINAL_PAIR).map(([pair, joined]) => [joined, [pair[0]!, pair[1]!]]),
);

const isVowel = (j: string) => JUNG.includes(j);

/** 자모 나열 → 한글 음절. 조립이 안 되는 자모는 낱자로 남긴다. */
function compose(jamos: string[]): string {
  let out = '';
  let cho = '';
  let jung = '';
  let jong = '';
  const flush = () => {
    if (cho && jung) {
      out += String.fromCharCode(
        0xac00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28 + JONG.indexOf(jong),
      );
    } else {
      out += cho + jung + jong;
    }
    cho = jung = jong = '';
  };
  for (const j of jamos) {
    if (!isVowel(j)) {
      if (cho && jung && !jong && JONG.includes(j)) jong = j;
      else if (cho && jung && jong && FINAL_PAIR[jong + j]) jong = FINAL_PAIR[jong + j]!;
      else {
        flush();
        cho = j;
      }
      continue;
    }
    // 모음
    if (cho && jung && jong) {
      // 받침이 다음 음절의 첫소리로 넘어간다 (명동 + ㅏ → 명도 + 다 …)
      const split = FINAL_SPLIT[jong];
      const nextCho = split ? split[1] : jong;
      jong = split ? split[0] : '';
      flush();
      cho = nextCho;
      jung = j;
    } else if (jung && VOWEL_PAIR[jung + j]) {
      jung = VOWEL_PAIR[jung + j]!;
    } else if (cho && !jung) {
      jung = j;
    } else {
      flush();
      jung = j;
    }
  }
  flush();
  return out;
}

/** 영문 자판 위치로 친 한 단어를 한글로 바꾼다. 영문 글자가 아닌 것이 섞이면 null. */
export function keyboardToHangul(word: string): string | null {
  if (!/^[A-Za-z]+$/.test(word)) return null;
  const jamos = [...word].map((ch) => KEY_TO_JAMO[ch] ?? KEY_TO_JAMO[ch.toLowerCase()]);
  if (jamos.some((j) => !j)) return null;
  return compose(jamos as string[]);
}

/**
 * 그 단어가 「한/영 전환을 잊은 한글」로 보이면 한글을, 아니면 null.
 * 바꾼 결과가 낱자 없이 완성 음절 2개 이상일 때만 인정한다 — 「shrine」→「노갸ㅜㄷ」처럼
 * 낱자가 남는 진짜 영어 단어는 건드리지 않는다.
 */
export function likelyKoreanTypedInEnglish(word: string): string | null {
  const hangul = keyboardToHangul(word);
  if (!hangul) return null;
  if (!/^[가-힣]{2,}$/.test(hangul)) return null;
  return hangul;
}

/**
 * 진짜 외국어 문장인가 — 영어·스페인어·프랑스어·이탈리아어·포르투갈어의 흔한 말이 하나라도 있거나
 * 악센트 글자·「¿」「¡」가 있으면 그렇다. 이런 문장은 한글로 되돌리면 안 된다:
 * 「Which shrine …」의 Which 가 「퍄냣」으로 바뀌어 미카엘 답 첫머리에 붙었다(2026-10-29 실측).
 * 한/영을 잊고 친 한글(「audehdtjdekd」)에는 이런 말이 없어 그대로 되돌려진다.
 */
const FOREIGN_WORDS =
  /\b(the|an|is|are|was|in|on|to|of|for|which|what|where|when|how|who|tell|about|shrines?|church|cathedral|visit|can|should|near|me|my|you|we|please|and|from|with|que|qu[eé]|d[oó]nde|c[oó]mo|santuario|iglesia|o[uù]|est|sanctuaire|[eé]glise|dove|chiesa|onde|igreja|por|para|del|des|les|une|uma)\b/i;
export function looksLikeForeignSentence(text: string): boolean {
  return FOREIGN_WORDS.test(text) || /[À-ɏ¿¡]/.test(text);
}

/** 문장 안에서 그런 단어만 골라 한글로 바꾼다. 하나도 없으면 원문 그대로. */
export function fixKoreanTypedInEnglish(text: string): string {
  if (looksLikeForeignSentence(text)) return text;
  return text.replace(/[A-Za-z]+/g, (w) => likelyKoreanTypedInEnglish(w) ?? w);
}
