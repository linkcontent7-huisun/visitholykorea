/**
 * 미카엘 대화 기록 — 로그인한 사람만 저장한다 (2026-09-18 사장님 결정, 스펙 7절).
 *
 * 비로그인이면 전부 조용히 건너뛴다 — 미카엘은 로그인 없이도 쓰는 기능이고,
 * 기록이 안 남는다고 대화를 막으면 본말이 뒤집힌다 (compass.repository 와 같은 태도).
 * 대화 목록(날짜별)은 만들지 않는다 — 사용자당 한 줄기.
 */

import { supabase } from '@/shared/api/supabase';
import type { ChatTurn } from './ai-guide.client';

const TABLE = 'ai_chat_messages';
/** 열 때 불러오는 최근 줄 수. 화면에 보여줄 만큼만 — 문맥으로는 마지막 6턴만 쓴다. */
export const HISTORY_LOAD_LIMIT = 30;

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** 내 최근 대화. 비로그인·기록 없음이면 빈 배열. 오래된 것 → 최신 순. */
export async function fetchChatHistory(): Promise<ChatTurn[]> {
  if (!(await currentUserId())) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('role, content, created_at')
    .order('created_at', { ascending: false })
    .limit(HISTORY_LOAD_LIMIT);
  if (error || !data) {
    if (error) console.error('fetchChatHistory error:', error);
    return [];
  }
  return (data as { role: 'user' | 'bot'; content: string }[])
    .reverse()
    .map((r) => ({ role: r.role, text: r.content }));
}

/** 질문·답을 한 쌍으로 저장. 실패해도 화면 흐름을 막지 않는다. */
export async function saveChatTurns(turns: ChatTurn[]): Promise<void> {
  const userId = await currentUserId();
  if (!userId || turns.length === 0) return;
  const { error } = await supabase
    .from(TABLE)
    .insert(turns.map((t) => ({ user_id: userId, role: t.role, content: t.text.slice(0, 8000) })));
  if (error) console.error('saveChatTurns error:', error);
}

/** 「대화 지우기」 — 내 대화 전부. RLS 가 본인 것만 지우게 막는다. */
export async function clearChatHistory(): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const { error } = await supabase.from(TABLE).delete().eq('user_id', userId);
  if (error) console.error('clearChatHistory error:', error);
  return !error;
}
