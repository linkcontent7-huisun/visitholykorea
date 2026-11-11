-- 미카엘 질문·답 익명 기록 — 답변 품질 개선과 재학습 자료용 (2026-11-11 사장님 지시).
--
-- 왜 따로 만드나: ai_chat_messages 는 「로그인한 사람의 대화 이어 보기」용이라 본인이 지우면 사라지고,
--   비로그인 질문(대부분의 방문자)은 아예 남지 않는다. 재학습 자료는 누가 물었는지가 아니라
--   무엇을 물었고 어떻게 답했는지가 필요하므로, 계정과 연결하지 않는 별도 표에 쌓는다.
-- 무엇을 안 담나: user_id · 방문자 식별값 · IP. 로그인 여부(signed_in)만 참·거짓으로 남긴다.
-- 누가 쓰고 읽나: 앱(anon·authenticated)은 **넣기만** 한다. 읽기·고치기·지우기 정책은 만들지 않는다 —
--   관리자가 서비스 키(db:export 등)로만 꺼낸다. 다른 표·기존 대화 저장과는 관계가 없다.
-- 다시 돌려도 같은 결과가 되게 if not exists / drop policy if exists 만 쓴다.

create table if not exists public.ai_question_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  question text not null check (char_length(question) between 1 and 2000),
  answer text not null check (char_length(answer) <= 8000),
  -- 질문할 때의 화면 언어 (ko·en·es·fr·pt·it)
  language text not null check (char_length(language) <= 8),
  -- 답이 참고한 성지 이름 (화면의 「참고한 성지」)
  sources text[] not null default '{}',
  -- 서버가 답하지 못해 준비된 문구로 대신한 경우
  fallback boolean not null default false,
  signed_in boolean not null default false
);

create index if not exists ai_question_logs_created_idx
  on public.ai_question_logs (created_at desc);

alter table public.ai_question_logs enable row level security;

drop policy if exists "ai_question_logs_insert" on public.ai_question_logs;
create policy "ai_question_logs_insert" on public.ai_question_logs
  for insert to anon, authenticated
  with check (true);

-- 넣기만 허용한다. 읽기·고치기·지우기는 정책이 없어 막힌다 — 권한도 걷어 둔다.
revoke all on public.ai_question_logs from anon, authenticated;
grant insert on public.ai_question_logs to anon, authenticated;
