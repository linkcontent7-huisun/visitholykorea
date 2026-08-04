-- 순례 여행기.
-- 앱의 "기록" 탭이 이 테이블을 읽는데 그동안 마이그레이션이 없어 스키마가 코드에만
-- 암묵적으로 존재했다. 여기서 명시적으로 정의한다.

create table if not exists public.pilgrimage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.holy_sites(id) on delete cascade,
  title text not null,
  content text not null default '',
  visit_date date not null default current_date,
  -- 성지명·사진은 조회 편의를 위한 비정규화 필드다(성지가 지워져도 기록은 남는다).
  site_name text,
  site_image text,
  created_at timestamptz not null default now()
);

create index if not exists pilgrimage_logs_user_visit_idx
  on public.pilgrimage_logs (user_id, visit_date desc);

alter table public.pilgrimage_logs enable row level security;

drop policy if exists "logs_select_own" on public.pilgrimage_logs;
create policy "logs_select_own" on public.pilgrimage_logs
  for select using (auth.uid() = user_id);

drop policy if exists "logs_insert_own" on public.pilgrimage_logs;
create policy "logs_insert_own" on public.pilgrimage_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "logs_update_own" on public.pilgrimage_logs;
create policy "logs_update_own" on public.pilgrimage_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "logs_delete_own" on public.pilgrimage_logs;
create policy "logs_delete_own" on public.pilgrimage_logs
  for delete using (auth.uid() = user_id);
