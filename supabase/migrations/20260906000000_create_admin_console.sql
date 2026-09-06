-- 관리자 콘솔 — 운영자가 앱에서 직접 사진을 바꾸고 글을 고치는 길 (사장님 요청 2026-09-06).
--
-- **왜 만드나** — 지금까지 성지 정보를 고치는 방법은 노트북에서 CLI 스크립트를
-- 돌리는 것뿐이었다(`scripts/feature-photo.ts` 등). 그런데 비어 있는 대표 사진
-- 155곳은 결국 현장에서 찍어야 하고, 현장에서 찍은 사진을 노트북 앞으로
-- 돌아와서 올리는 건 사실상 안 하게 된다. 그래서 휴대폰에서 바로 바꿀 수 있게 한다.
--
-- **왜 service_role 키를 앱에 넣지 않나** — `VITE_` 값은 브라우저 번들에 그대로
-- 들어간다. service_role 키 한 장이면 208곳을 전부 지울 수 있다. 대신 여기서
-- `profiles.role` 을 만들고 RLS 정책으로 "관리자만 쓰기"를 DB 쪽에 못 박는다.
-- 앱은 지금 쓰는 공개 키 그대로 쓰고, 권한 판단은 서버가 한다.
--
-- **권한을 좁게 준 이유**
--   - 성지 삭제·추가는 정책 자체를 만들지 않는다 → 화면에서 실수해도 208곳이 안 사라진다.
--   - 관리자에게 회원 정보(이메일·user_id)를 보여주지 않는다 → 승인 화면은
--     `admin_pending_photos` 뷰만 보고, 그 뷰에 user_id 가 없다.
--   - 수정은 전부 `site_revisions` 에 이전 값이 남는다 → 되돌릴 수 있다.
--     성지 역사 정보는 틀리면 신뢰가 바로 무너지므로 되돌리기가 없으면 안 된다.
--
-- 이 파일도 다른 마이그레이션처럼 여러 번 돌려도 안전해야 한다(러너 규칙).

-- ---------------------------------------------------------------------------
-- 1) 권한 칸
--    member : 보통 순례자 (기본값)
--    editor : 교구 담당자·자원봉사 — 자기 교구 성지만 고친다
--    admin  : 운영자 — 전 교구
--    editor 인데 diocese 가 비어 있으면 전 교구를 맡는다.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists diocese text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles
      add constraint profiles_role_check check (role in ('member', 'editor', 'admin'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) 권한 판단 함수
--    security definer 인 이유: profiles 에는 "본인 행만 읽기" RLS 가 걸려 있는데,
--    정책 안에서 profiles 를 다시 조회하면 무한 재귀가 난다. 함수로 한 번 빠져나온다.
-- ---------------------------------------------------------------------------
create or replace function public.admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role from profiles where id = auth.uid()), 'member');
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.admin_role() in ('admin', 'editor');
$$;

-- 이 교구의 성지를 고칠 수 있는가. admin 은 전부, editor 는 맡은 교구만.
create or replace function public.can_edit_site(p_diocese text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case public.admin_role()
    when 'admin' then true
    when 'editor' then
      coalesce((select diocese from profiles where id = auth.uid()), '')
        in ('', coalesce(p_diocese, ''))
    else false
  end;
$$;

grant execute on function public.admin_role() to authenticated;
grant execute on function public.is_editor() to authenticated;
grant execute on function public.can_edit_site(text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) 성지 수정 권한 — update 만 연다. insert·delete 정책은 일부러 만들지 않는다.
-- ---------------------------------------------------------------------------
drop policy if exists "holy_sites_editor_update" on public.holy_sites;
create policy "holy_sites_editor_update" on public.holy_sites
  for update to authenticated
  using (public.can_edit_site(diocese))
  with check (public.can_edit_site(diocese));

-- ---------------------------------------------------------------------------
-- 4) 수정 이력 — 되돌리기의 근거. 트리거가 자동으로 남기므로 화면이 깜빡해도 빠지지 않는다.
-- ---------------------------------------------------------------------------
create table if not exists public.site_revisions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.holy_sites (id) on delete cascade,
  -- 누가 고쳤나. 스크립트로 고치면 null 이다(로그인 세션이 없으므로).
  editor uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now(),
  -- 고치기 **전** 행 전체. 한 칸만 되돌릴 수도, 통째로 되돌릴 수도 있다.
  before jsonb not null,
  -- 실제로 값이 바뀐 칸 이름들. 목록에서 "무엇을 고쳤는지" 한눈에 보이라고 둔다.
  fields text[] not null
);

create index if not exists site_revisions_site_idx
  on public.site_revisions (site_id, changed_at desc);

alter table public.site_revisions enable row level security;

drop policy if exists "site_revisions_editor_read" on public.site_revisions;
create policy "site_revisions_editor_read" on public.site_revisions
  for select to authenticated using (public.is_editor());

create or replace function public.record_site_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed text[];
begin
  select array_agg(o.key) into changed
  from jsonb_each(to_jsonb(old)) as o(key, value)
  where o.value is distinct from (to_jsonb(new) -> o.key);

  -- 값이 하나도 안 바뀐 update 는 이력을 남기지 않는다(빈 줄이 쌓이면 못 읽는다).
  if changed is null then
    return new;
  end if;

  insert into site_revisions (site_id, editor, before, fields)
  values (old.id, auth.uid(), to_jsonb(old), changed);
  return new;
end;
$$;

drop trigger if exists holy_sites_record_revision on public.holy_sites;
create trigger holy_sites_record_revision
  before update on public.holy_sites
  for each row execute function public.record_site_revision();

-- ---------------------------------------------------------------------------
-- 5) 성지 대표 사진 저장소. 읽기는 공개(앱이 보여줘야 하므로), 쓰기는 운영자만.
--    순례자 사진(pilgrim-photos)과 버킷을 나눈 이유: 순례자 사진은 "본인 uid 폴더"
--    규칙으로 잠겨 있어 운영자가 쓸 수 없다. 성격이 다른 두 사진을 섞지 않는다.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-photos', 'site-photos', true)
on conflict (id) do nothing;

drop policy if exists "site_photos_read_all" on storage.objects;
create policy "site_photos_read_all" on storage.objects
  for select using (bucket_id = 'site-photos');

drop policy if exists "site_photos_insert_editor" on storage.objects;
create policy "site_photos_insert_editor" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-photos' and public.is_editor());

drop policy if exists "site_photos_update_editor" on storage.objects;
create policy "site_photos_update_editor" on storage.objects
  for update to authenticated
  using (bucket_id = 'site-photos' and public.is_editor());

drop policy if exists "site_photos_delete_editor" on storage.objects;
create policy "site_photos_delete_editor" on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-photos' and public.is_editor());

-- ---------------------------------------------------------------------------
-- 6) 순례자 사진 승인함.
--    스탬프 표 자체를 운영자에게 열지 않는다 — user_id 가 딸려오기 때문이다.
--    대신 사진과 한 줄만 담은 뷰를 준다. 권한이 없으면 0줄이 나온다.
-- ---------------------------------------------------------------------------
drop view if exists public.admin_pending_photos;
create view public.admin_pending_photos as
  select
    s.id as stamp_id,
    s.site_id,
    h.name as site_name,
    h.diocese,
    s.photo_url,
    s.note,
    s.photo_featured,
    s.created_at
  from public.pilgrimage_stamps s
  join public.holy_sites h on h.id = s.site_id
  where s.photo_url is not null
    and s.hidden = false
    and public.can_edit_site(h.diocese);

grant select on public.admin_pending_photos to authenticated;

-- 승인/승인취소. 스탬프 표에 update 정책을 다는 대신 함수로만 열어
-- "이 두 칸 말고는 못 건드린다"를 보장한다.
create or replace function public.admin_set_photo_featured(p_stamp_id uuid, p_featured boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  site_diocese text;
begin
  select h.diocese into site_diocese
  from pilgrimage_stamps s
  join holy_sites h on h.id = s.site_id
  where s.id = p_stamp_id;

  if not found then
    raise exception '없는 기록입니다';
  end if;

  if not public.can_edit_site(site_diocese) then
    raise exception '권한이 없습니다';
  end if;

  update pilgrimage_stamps set photo_featured = p_featured where id = p_stamp_id;
end;
$$;

-- 부적절한 사진·글 즉시 내리기. 신고 3건 자동 숨김(report_visit_note)과 별개로
-- 운영자가 직접 쥐는 손잡이다. 내리면 대표 사진 승인도 같이 풀린다.
create or replace function public.admin_set_note_hidden(p_stamp_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  site_diocese text;
begin
  select h.diocese into site_diocese
  from pilgrimage_stamps s
  join holy_sites h on h.id = s.site_id
  where s.id = p_stamp_id;

  if not found then
    raise exception '없는 기록입니다';
  end if;

  if not public.can_edit_site(site_diocese) then
    raise exception '권한이 없습니다';
  end if;

  update pilgrimage_stamps
     set hidden = p_hidden,
         photo_featured = case when p_hidden then false else photo_featured end
   where id = p_stamp_id;
end;
$$;

revoke all on function public.admin_set_photo_featured(uuid, boolean) from public;
revoke all on function public.admin_set_note_hidden(uuid, boolean) from public;
grant execute on function public.admin_set_photo_featured(uuid, boolean) to authenticated;
grant execute on function public.admin_set_note_hidden(uuid, boolean) to authenticated;
