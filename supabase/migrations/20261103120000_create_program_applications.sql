-- 체험여행 프로그램 접수 (2026-11-03 사장님 지시 — 한남대 바이브코딩 본선 시연)
--
-- 대전 성지 화면에 뜨는 프로그램 카드 → 「접수하기」 → 이 표에 한 줄.
-- 프로그램 내용(제목·코스·일정)은 아직 앱 코드(`src/features/programs/data/programs.ts`)에 둔다.
-- 기관이 직접 프로그램을 등록하는 단계에서 표로 옮긴다.
--
-- 받는 개인정보는 대표자 이름·연락처 두 가지뿐. 아동 이름·생년월일은 받지 않는다(제안서 약속).
-- 로그인 없이도 접수할 수 있다(현장 방문자 대상). 대신 쓰기만 되고, 읽기는 관리자만.

create table if not exists public.program_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  program_slug text not null check (program_slug ~ '^[a-z0-9-]{1,60}$'),
  course text not null check (course ~ '^[A-Z]$'),
  visit_date date not null,
  contact_name text not null check (length(btrim(contact_name)) between 1 and 40),
  contact_phone text not null check (contact_phone ~ '^[0-9-]{9,14}$'),
  adults smallint not null default 0 check (adults between 0 and 30),
  children smallint not null default 0 check (children between 0 and 30),
  seniors smallint not null default 0 check (seniors between 0 and 30),
  needs_mobility_help boolean not null default false,
  request_note text check (request_note is null or length(request_note) <= 300),
  privacy_consent boolean not null check (privacy_consent),
  created_at timestamptz not null default now(),
  check (adults + children + seniors between 1 and 30)
);

create index if not exists program_applications_program_idx
  on public.program_applications (program_slug, visit_date);

alter table public.program_applications enable row level security;

-- 누구나 접수(쓰기)만. 로그인한 사람은 자기 user_id 로만, 비로그인은 user_id 없이.
drop policy if exists program_applications_insert on public.program_applications;
create policy program_applications_insert on public.program_applications
  for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

-- 접수 목록·집계는 관리자만 본다. 신청자 본인 조회는 아직 없음(접수번호로 문의).
drop policy if exists program_applications_admin_select on public.program_applications;
create policy program_applications_admin_select on public.program_applications
  for select using (public.admin_role() = 'admin');

drop policy if exists program_applications_admin_delete on public.program_applications;
create policy program_applications_admin_delete on public.program_applications
  for delete using (public.admin_role() = 'admin');

grant insert on public.program_applications to anon, authenticated;
grant select, delete on public.program_applications to authenticated;
