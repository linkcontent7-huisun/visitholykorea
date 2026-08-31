-- 순례자 사진 — "함께 만드는 순례앱" (사용자 요청 2026-09-01).
--
-- 위키피디아의 정신(모두가 기여)을 가져오되 방식은 다르다: 공식 정보는
-- 우리가 관리하고, 순례자는 **자기 경험**(한 줄 + 사진)을 기여한다.
-- 스탬프에 사진을 붙이는 구조라 실제 방문자만 올릴 수 있다 — 별도 인증이 필요 없다.
--
-- 이 파일도 다른 마이그레이션처럼 여러 번 돌려도 안전해야 한다(러너 규칙).

-- 1) 스탬프에 사진과 숨김(신고 처리) 플래그를 붙인다
alter table public.pilgrimage_stamps
  add column if not exists photo_url text;
alter table public.pilgrimage_stamps
  add column if not exists hidden boolean not null default false;

-- 2) 사진 저장소. 공개 읽기 — 순례자 이야기는 누구나 본다.
insert into storage.buckets (id, name, public)
values ('pilgrim-photos', 'pilgrim-photos', true)
on conflict (id) do nothing;

-- 경로 첫 폴더가 본인 uid 인 파일만 올리고 지울 수 있다.
drop policy if exists "pilgrim_photos_insert_own" on storage.objects;
create policy "pilgrim_photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'pilgrim-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "pilgrim_photos_update_own" on storage.objects;
create policy "pilgrim_photos_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'pilgrim-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "pilgrim_photos_delete_own" on storage.objects;
create policy "pilgrim_photos_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'pilgrim-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "pilgrim_photos_read_all" on storage.objects;
create policy "pilgrim_photos_read_all" on storage.objects
  for select using (bucket_id = 'pilgrim-photos');

-- 3) 공개 뷰 갱신 — 사진 포함, 숨김 제외. id 는 신고에 필요하다
--    (uuid 라 사람을 특정할 수 없고, user_id 는 여전히 뷰 밖이다).
drop view if exists public.site_visit_notes;
create view public.site_visit_notes as
  select id, site_id, note, photo_url, created_at
  from public.pilgrimage_stamps
  where (note is not null or photo_url is not null)
    and hidden = false;

grant select on public.site_visit_notes to anon, authenticated;

-- 4) 신고. 같은 사람이 같은 글을 두 번 신고해도 한 번으로 친다.
create table if not exists public.visit_note_reports (
  stamp_id uuid not null references public.pilgrimage_stamps(id) on delete cascade,
  reporter uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (stamp_id, reporter)
);

alter table public.visit_note_reports enable row level security;

drop policy if exists "reports_insert_own" on public.visit_note_reports;
create policy "reports_insert_own" on public.visit_note_reports
  for insert to authenticated with check (reporter = auth.uid());

-- 5) 신고 함수 — 3명이 신고하면 자동으로 숨긴다. 운영자가 한 명뿐이라
--    사람 손을 기다리면 밤사이 문제 글이 계속 노출된다.
create or replace function public.report_visit_note(p_stamp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  insert into visit_note_reports (stamp_id, reporter)
  values (p_stamp_id, auth.uid())
  on conflict do nothing;

  update pilgrimage_stamps
  set hidden = true
  where id = p_stamp_id
    and (select count(*) from visit_note_reports where stamp_id = p_stamp_id) >= 3;
end;
$$;

revoke all on function public.report_visit_note(uuid) from public;
grant execute on function public.report_visit_note(uuid) to authenticated;
