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
/** 로그인 사용자의 DB 기록을 이미 불러왔는지 — 시트를 열 때마다 다시 읽지 않게 */
let loadedFor: string | null = null;
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
  markLoaded(userId: string | null) {
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
