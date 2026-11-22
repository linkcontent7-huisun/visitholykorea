/**
 * 3D 가상 순례(/visit/)에 로그인한 순례자의 이름을 넘긴다 (2026-11-22 사장님: 「로그인해서 3D 로 들어가면 순례자 이름이 연동되어 나오게」).
 *
 * 3D 는 운영에서 rewrite 로 같은 주소(www.visitholykorea.com/visit/) 아래에 붙어 있어 브라우저 저장소를 함께 쓴다.
 * 그래서 로그인 토큰이나 이메일을 3D 에 건네지 않고, **이름 한 줄만** 이 열쇠에 써 둔다. 로그아웃하면 지운다.
 * 주소 꼬리표(?name=)로 넘기지 않는다 — 개인 정보를 주소에 남기지 않는다.
 *
 * 이름은 3D 입장 화면의 이름 칸과 같은 규칙으로 다듬는다(visit-3d/src/main.ts 의 cleanNick, 9자).
 * 이름이 비어 있으면(가입 때 이름을 안 넣은 경우) 아무것도 쓰지 않는다 — 이메일로 대신하지 않는다.
 */
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/api/supabase';

/** 3D 가 읽는 열쇠. 바꾸면 visit-3d 쪽도 같이 바꾼다 */
export const PILGRIM_NAME_KEY = 'vhk.pilgrimName';
/** 3D 입장 화면 이름 칸의 최대 글자 수(visit-3d/index.html maxlength) */
export const PILGRIM_NAME_MAX = 9;

/** 글자·숫자·빈칸·_·- 만 남기고 9자로 자른다. 남는 것이 없으면 null */
export function cleanPilgrimName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const s = raw
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  const cut = [...s].slice(0, PILGRIM_NAME_MAX).join('').trim();
  return cut || null;
}

/** 세션에서 3D 에 넘길 이름. 이메일은 쓰지 않는다 */
export function pilgrimNameOf(session: Session | null): string | null {
  return cleanPilgrimName(session?.user.user_metadata?.name);
}

/** 저장소에 쓰거나 지운다. 저장소를 못 쓰는 브라우저에서는 조용히 넘어간다 */
export function writePilgrimName(
  name: string | null,
  storage: Storage | undefined = globalThis.localStorage,
): void {
  try {
    if (name) storage?.setItem(PILGRIM_NAME_KEY, name);
    else storage?.removeItem(PILGRIM_NAME_KEY);
  } catch {
    // 사생활 보호 창 등 — 3D 는 지금처럼 이름 칸을 비워 둔다
  }
}

let started = false;
/** 앱 시작 때 한 번. 처음 세션·로그인·이름 바꾸기·로그아웃마다 갱신한다 */
export function startPilgrimNameSync(): void {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((_event, session) => writePilgrimName(pilgrimNameOf(session)));
}
