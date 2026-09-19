-- 미카엘 AI 대화 기록 — 로그인한 사람의 대화를 한 줄기로 저장한다 (2026-09-18 사장님 결정).
--
-- 왜 저장하나: 시트를 닫았다 열어도, 새로고침해도 지난 대화가 그대로 남아 있게. 추후 취향 기반 추천의 재료.
-- 왜 이 모양인가: 대화 목록(날짜별 여러 대화)은 오버스펙이라 안 만든다 — 사용자당 한 줄기라 conversation_id 가 없다.
-- 비로그인은 저장하지 않는다(브라우저 세션 안에서만). compass_responses 와 같은 규칙: 본인만 읽고 · 쓰고 · 지운다.
-- 스펙: docs/DSH/2026-09-18-미카엘-챗봇-스펙.md 7절

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'bot')),
  content text not null check (char_length(content) <= 8000),
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_user_idx
  on public.ai_chat_messages (user_id, created_at);

alter table public.ai_chat_messages enable row level security;

drop policy if exists "ai_chat_select_own" on public.ai_chat_messages;
create policy "ai_chat_select_own" on public.ai_chat_messages
  for select using (auth.uid() = user_id);

drop policy if exists "ai_chat_insert_own" on public.ai_chat_messages;
create policy "ai_chat_insert_own" on public.ai_chat_messages
  for insert with check (auth.uid() = user_id);

drop policy if exists "ai_chat_delete_own" on public.ai_chat_messages;
create policy "ai_chat_delete_own" on public.ai_chat_messages
  for delete using (auth.uid() = user_id);

-- 수정은 없다 — 대화는 지우거나 남기거나 둘 중 하나.
revoke update on public.ai_chat_messages from anon, authenticated;
