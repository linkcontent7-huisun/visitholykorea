// 입장 화면 이름 칸을 무엇으로 채울지 (2026-11-22 사장님: 「로그인해서 3D 로 들어가면 순례자 이름이 같이 나오게」)
// 메인 사이트가 로그인·이름 바꾸기 때 localStorage 'vhk.pilgrimName'(9자, 다듬어진 계정 이름)을 쓰고 로그아웃 때 지운다(메인 PR #136).
// 3D 는 이 열쇠를 읽기만 한다 — 쓰거나 지우지 않는다. 이메일·토큰은 읽지 않는다.
// 순서(팀장 권장안): 3D 이름 칸에서 직접 고친 이름 → 계정 이름 → 전에 쓴 이름 → 빈칸(입장 때 「순례자1234」)

export const NAME_MAX = 9;
export const KEY_ACCOUNT = 'vhk.pilgrimName';
export const KEY_NICK = 'vhk.nick';
/** 이 이름을 순례자가 3D 칸에서 직접 적었는가('1') — 계정 이름을 그대로 쓴 것과 가른다 */
export const KEY_NICK_SELF = 'vhk.nickSelf';

/** 3D 이름 칸 규칙: 글자·숫자·빈칸·_·- 만, 9자 */
export function cleanName(s: string | null | undefined): string {
  return (s ?? '').normalize('NFC').replace(/[^\p{L}\p{N} _-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

export interface NameStore { getItem(k: string): string | null }

/** 입장 화면을 열 때 칸에 넣을 이름 */
export function initialName(store: NameStore | null | undefined): string {
  if (!store) return '';
  let account = '', nick = '', self = false;
  try { account = cleanName(store.getItem(KEY_ACCOUNT)); nick = cleanName(store.getItem(KEY_NICK)); self = store.getItem(KEY_NICK_SELF) === '1'; } catch { return ''; }
  if (self && nick) return nick;
  return account || nick;
}

/** 입장할 때: 칸의 이름이 계정 이름과 다르면 「직접 고친 이름」으로 표시한다 */
export function isSelfName(name: string, store: NameStore | null | undefined): boolean {
  let account = '';
  try { account = cleanName(store?.getItem(KEY_ACCOUNT)); } catch { /* 저장소 없음 */ }
  return !account || name !== account;
}

// ── 무작위 순례자 이름 (사장님 2026-11-25: 「성경에 나온 인물들 — 열두 제자부터 사제, 예언자들 이름으로, ‘순례길을 다니는 중’ 같은 다양한 이름」) ──
// 이름 칸이 비어 있으면(로그인한 이름도, 직접 적은 이름도 없으면) 이 가운데 하나를 칸에 넣어 준다. 고치거나 🎲 로 다시 뽑을 수 있다.
// 한국 천주교 표기. 별칭은 9자까지이므로(NAME_MAX) 덧말은 들어갈 때만 붙인다.
export const BIBLE_NAMES: readonly string[] = [
  // 열두 사도
  '베드로', '안드레아', '야고보', '요한', '필립보', '바르톨로메오', '토마스', '마태오', '타대오', '시몬', '마티아',
  // 예언자
  '모세', '사무엘', '나단', '엘리야', '엘리사', '이사야', '예레미야', '에제키엘', '다니엘', '호세아', '요엘', '아모스', '요나', '미카', '나훔', '하바쿡', '스바니야', '하까이', '즈카르야', '말라키',
  // 사제와 초대 교회
  '아론', '엘리', '에즈라', '멜키체덱', '스테파노', '바르나바', '바오로', '루카', '마르코', '티모테오', '티토',
  // 성경 속 여성
  '한나', '룻', '에스테르', '유딧', '엘리사벳', '안나', '루디아', '프리스카',
];
/** 이름 뒤에 붙는 덧말 — 순례길을 다니는 중이라는 뜻(3분의 1쯤만, 9자 안일 때만) */
export const NAME_TAILS: readonly string[] = ['순례중', '걷는중', '기도중', '순례길'];

/** 무작위 순례자 이름 한 개. rnd 를 넘기면 시험에서 정해진 값을 얻는다 */
export function randomPilgrimName(rnd: () => number = Math.random): string {
  const base = BIBLE_NAMES[Math.floor(rnd() * BIBLE_NAMES.length)] ?? '순례자';
  if (rnd() < 0.34) {
    const tail = NAME_TAILS[Math.floor(rnd() * NAME_TAILS.length)] ?? '';
    const withTail = `${base} ${tail}`;
    if (withTail.length <= NAME_MAX) return withTail;
  }
  return base;
}
