-- 나만의 장소 기록 (2026-11-01 사장님 지시)
--
-- 성지 213곳 밖의 성당·공소·가톨릭 건물도 다녀온 뒤 기록할 수 있게 한다.
-- 주교회의 주소록(catholic_directory)에 있는 곳이면 골라서 이름·주소를 채우고(directory_id),
-- 없으면 이름부터 직접 쓴다.
--
-- 꼭 받는 것: 장소 이름 · 사진 · 그날의 감정. 나머지(주소·설명·한 줄)는 비워도 된다.
-- 공개: 사장님 결정 「관리자 확인 후 공개」 — 처음엔 pending, admin 이 approved 로 바꿔야 남에게 보인다.

create table if not exists public.user_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  directory_id uuid references public.catholic_directory (id) on delete set null,
  name text not null check (length(btrim(name)) between 1 and 100),
  address text check (address is null or length(address) <= 200),
  description text check (description is null or length(description) <= 2000),
  photo_url text not null check (length(photo_url) > 0),
  emotion text not null check (emotion in ('peace', 'joy', 'moved', 'grateful', 'reflective', 'sorrow')),
  emotion_note text check (emotion_note is null or length(emotion_note) <= 200),
  visited_on date not null default current_date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_places_user_idx on public.user_places (user_id, created_at desc);
create index if not exists user_places_status_idx on public.user_places (status) where status = 'pending';

alter table public.user_places enable row level security;

-- 내 기록은 상태와 상관없이 본다. 남의 기록은 승인된 것만.
drop policy if exists user_places_select on public.user_places;
create policy user_places_select on public.user_places
  for select using (user_id = auth.uid() or status = 'approved' or public.admin_role() = 'admin');

-- 새로 쓰는 기록은 언제나 「확인 대기」로만 들어간다 — 스스로 승인할 수 없다.
drop policy if exists user_places_insert on public.user_places;
create policy user_places_insert on public.user_places
  for insert with check (user_id = auth.uid() and status = 'pending' and reviewed_at is null);

drop policy if exists user_places_delete on public.user_places;
create policy user_places_delete on public.user_places
  for delete using (user_id = auth.uid() or public.admin_role() = 'admin');

-- 수정은 관리자만(승인·반려). 본인 수정은 지우고 다시 쓰는 것으로 — 승인 뒤 내용을 바꿔
-- 검토를 우회하는 길을 막는다.
drop policy if exists user_places_admin_update on public.user_places;
create policy user_places_admin_update on public.user_places
  for update using (public.admin_role() = 'admin') with check (public.admin_role() = 'admin');
