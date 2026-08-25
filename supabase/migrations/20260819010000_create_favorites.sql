-- 즐겨찾기(찜하기).
-- 성지 상세의 하트 버튼이 UI 로만 있고 저장할 곳이 없었다 (로드맵 3단계).
-- 스탬프("다녀왔다")와 다른 축이다 — 즐겨찾기는 "가고 싶다"를 담는다.

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references public.holy_sites(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, site_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete using (auth.uid() = user_id);
