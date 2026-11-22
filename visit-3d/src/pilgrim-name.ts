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
