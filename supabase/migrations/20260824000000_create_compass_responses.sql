-- 마음 나침반 응답 저장 (로드맵 3단계).
--
-- 지금은 7문항 답과 추천 결과가 화면 안에서만 쓰이고 사라진다. 저장해 두면
-- 재방문 때 "지난번엔 이곳을 권해드렸어요"로 이어지고, 나중에 추천 개인화의
-- 원료가 된다. 본인 것만 읽고 쓰는 개인 기록이다.

create table if not exists public.compass_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 감정·고민·지역 등 답 전체. 질문이 바뀌어도 스키마를 안 바꾸려고 jsonb 로 둔다.
  answers jsonb not null,
  -- 그때 권한 성지. 성지가 지워져도 기록은 남도록 set null.
  matched_site_id uuid references public.holy_sites(id) on delete set null,
  matched_site_name text,
  created_at timestamptz not null default now()
);

create index if not exists compass_responses_user_idx
  on public.compass_responses (user_id, created_at desc);

alter table public.compass_responses enable row level security;

drop policy if exists "compass_select_own" on public.compass_responses;
create policy "compass_select_own" on public.compass_responses
  for select using (auth.uid() = user_id);

drop policy if exists "compass_insert_own" on public.compass_responses;
create policy "compass_insert_own" on public.compass_responses
  for insert with check (auth.uid() = user_id);

drop policy if exists "compass_delete_own" on public.compass_responses;
create policy "compass_delete_own" on public.compass_responses
  for delete using (auth.uid() = user_id);
