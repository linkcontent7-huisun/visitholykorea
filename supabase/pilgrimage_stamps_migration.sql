-- VisitHolyKorea: 순례 스탬프(디지털 순례 여권) 테이블
-- 로그인한 사용자가 성지를 "다녀왔다"고 기록하면 스탬프가 하나씩 쌓인다.
-- 로그인 후에는 Supabase 클라이언트가 사용자 토큰을 자동으로 붙여 보내므로,
-- anon 키 + RLS 정책(auth.uid() = user_id)만으로 안전하게 본인 데이터만 다룰 수 있다.

create table if not exists public.pilgrimage_stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.holy_sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, site_id)
);

alter table public.pilgrimage_stamps enable row level security;

drop policy if exists "stamps_select_own" on public.pilgrimage_stamps;
create policy "stamps_select_own" on public.pilgrimage_stamps
  for select using (auth.uid() = user_id);

drop policy if exists "stamps_insert_own" on public.pilgrimage_stamps;
create policy "stamps_insert_own" on public.pilgrimage_stamps
  for insert with check (auth.uid() = user_id);

drop policy if exists "stamps_delete_own" on public.pilgrimage_stamps;
create policy "stamps_delete_own" on public.pilgrimage_stamps
  for delete using (auth.uid() = user_id);
