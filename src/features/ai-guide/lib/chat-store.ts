import { useSyncExternalStore } from 'react';
import type { ChatTurn } from '../api/ai-guide.client';

/**
 * 미카엘 대화의 한 줄기 — 앱 안에서 하나만 있다.
 *
 * 헤더 버튼과 홈 카드가 각각 시트를 여는데, 예전엔 둘이 따로 상태를 들고 있어 대화가 이어지지
 * 않았다(2026-09-18 동료 확인). 모듈 하나에 두면 어느 입구로 열어도 같은 대화다.
 * 비로그인은 여기까지만(브라우저 세션) — 새로고침하면 사라진다. 로그인은 DB 에서 채운다.
 */
export interface ChatMessage extends ChatTurn {
  fallback?: boolean;
  sources?: string[];
}

let messages: ChatMessage[] = [];
/**
 * 누구 기록을 채워 뒀는지 — 시트를 열 때마다 다시 읽지 않게. 로그인 id 또는 null(비로그인).
 * 처음엔 undefined 여야 한다: null 로 두면 비로그인(null)과 같아져 첫 인사말이 안 뜬다 (2026-09-18 배포본 실측).
 */
let loadedFor: string | null | undefined = undefined;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export const chatStore = {
  get: () => messages,
  set(next: ChatMessage[]) {
    messages = next;
    emit();
  },
  append(...items: ChatMessage[]) {
    messages = [...messages, ...items];
    emit();
  },
  clear() {
    messages = [];
    emit();
  },
  loadedFor: () => loadedFor,
  markLoaded(userId: string | null | undefined) {
    loadedFor = userId;
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useChatMessages(): ChatMessage[] {
  return useSyncExternalStore(chatStore.subscribe, chatStore.get, chatStore.get);
}
