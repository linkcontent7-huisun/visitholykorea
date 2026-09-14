-- 순례 스탬프의 관리자 전용 열(hidden·photo_featured) 잠금 (2026-09-14, DB 권한 검토)
--
-- pilgrimage_stamps 의 insert/update 정책(stamps_insert_own · stamps_update_own)은 "본인 행"만
-- 검사하고 어느 열인지는 보지 않는다. Supabase 기본 권한이 authenticated 에 표 전체 INSERT/UPDATE 를
-- 주므로, 회원이 자기 행의 hidden 을 false 로 되돌리거나(신고 3건 자동 숨김·운영자 숨김 무력화)
-- photo_featured 를 true 로 올려 자기 사진을 성지 대표 사진으로 만들 수 있었다.
-- profiles 의 role 을 막았던 방식(20260914110000 · 20260914120000)을 그대로 따른다:
--   1) 열 단위 GRANT 로 회원이 쓸 수 있는 열을 명시한다
--   2) 트리거로 hidden·photo_featured 변경을 한 번 더 막는다 — GRANT 가 나중에 넓어져도 안전
-- 함께 발견한 것 두 가지도 여기서 고친다:
--   3) stamp_photos 공개 읽기 정책이 숨긴 스탬프의 사진까지 노출했다
--   4) 스토리지 pilgrim_photos_update_own 에 with check 가 없어 갱신으로 남의 폴더 경로로 옮길 수 있었다
-- events 의 anon insert 는 손대지 않는다 — docs/20-architecture/DB-권한-검토-2026-09-14.md 참고.
--
-- 여러 번 돌려도 안전하다.

-- ---------------------------------------------------------------------------
-- 0) 방문일. created_at 은 "앱에서 찍은 시각"이라 나중에 몰아서 기록하면 실제 방문일과 어긋난다.
--    사용자가 고르는 날짜를 따로 둔다. 화면 연결은 뒤에 한다 — 지금은 열과 권한만 준비.
-- ---------------------------------------------------------------------------
alter table public.pilgrimage_stamps
  add column if not exists visited_on date;

comment on column public.pilgrimage_stamps.visited_on is
  '사용자가 고른 실제 방문일. created_at(앱에서 기록한 시각)과 별개. null = 고르지 않음.';

-- ---------------------------------------------------------------------------
-- 1) 열 단위 권한. select·delete 는 표 단위 그대로 둔다(정책이 본인 행으로 좁힌다).
--    id·created_at·hidden·photo_featured 는 목록에서 뺀다 — 앱(stamps.repository.ts)은
--    user_id·site_id·note·transport_mode 로 insert 하고 note·photo_url 만 update 하므로 영향 없다.
-- ---------------------------------------------------------------------------
revoke insert, update on public.pilgrimage_stamps from anon, authenticated;
grant insert (user_id, site_id, note, photo_url, transport_mode, visited_on)
  on public.pilgrimage_stamps to authenticated;
grant update (note, photo_url, transport_mode, visited_on)
  on public.pilgrimage_stamps to authenticated;

-- ---------------------------------------------------------------------------
-- 2) 보호 트리거.
--
-- ⚠ profiles 의 protect_profile_role 과 달리 **security definer 를 붙이지 않고 current_user 로 판단한다.**
-- 이유: hidden·photo_featured 를 정당하게 바꾸는 길은 전부 security definer 함수다
-- (admin_set_note_hidden · admin_set_photo_featured · report_visit_note). 이 함수들은 PostgREST 가
-- `set local role authenticated` 로 실행하는데, security definer 는 current_user(권한 검사 주체)만
-- 소유자(postgres)로 바꾸고 `role` 설정값은 그대로 두므로, 그 안에서도
-- current_setting('role') 은 'authenticated' 를 돌려준다. 즉 profiles 방식의 조건을 그대로 쓰면
-- 관리자 숨김·대표 승인·신고 자동 숨김이 전부 42501 로 막힌다.
-- 반면 current_user 는 PostgreSQL 문서대로 "SECURITY DEFINER 함수 실행 중에는 소유자로 바뀐다".
--   - 앱이 표를 직접 update: current_user = authenticated → 막는다
--   - 위 definer 함수 안의 update:  current_user = postgres(소유자) → 통과
--   - 노트북 직결 스크립트:         current_user = postgres → 통과
--   - Edge Function(service_role):  current_user = service_role → 통과
-- 이 판단이 성립하려면 트리거 함수 자체가 호출자 권한(기본값)으로 돌아야 한다.
-- **이 함수에 security definer 를 붙이면 current_user 가 항상 postgres 가 되어 잠금이 사라진다.**
-- ---------------------------------------------------------------------------
create or replace function public.protect_stamp_admin_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      if new.hidden or new.photo_featured then
        raise exception '숨김·대표 사진 여부는 사용자가 정할 수 없습니다.' using errcode = '42501';
      end if;
    elsif new.hidden is distinct from old.hidden
       or new.photo_featured is distinct from old.photo_featured then
      raise exception '숨김·대표 사진 여부는 사용자가 바꿀 수 없습니다.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists stamps_protect_admin_fields on public.pilgrimage_stamps;
create trigger stamps_protect_admin_fields
  before insert or update on public.pilgrimage_stamps
  for each row execute function public.protect_stamp_admin_fields();

-- ---------------------------------------------------------------------------
-- 3) stamp_photos 공개 읽기 — 숨긴 스탬프의 사진은 빼고, 본인 것은 항상 보이게.
--
-- pilgrimage_stamps 는 "본인 행만 select" 정책이라, 정책 안에서 그 표를 직접 서브쿼리하면
-- anon·타인에게는 한 행도 안 보여 사진이 전부 사라진다. 그래서 hidden 판정만 definer 함수로
-- 뺀다(can_edit_site 와 같은 방식) — 돌려주는 건 boolean 하나라 사생활 노출은 없다.
-- 앱의 공개 화면은 site_visit_notes 뷰(소유자 권한)로 읽으므로 이 정책은 표 직접 조회에만 걸린다.
-- ---------------------------------------------------------------------------
create or replace function public.stamp_is_visible(p_stamp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from pilgrimage_stamps where id = p_stamp_id and hidden = false
  );
$$;

revoke all on function public.stamp_is_visible(uuid) from public;
grant execute on function public.stamp_is_visible(uuid) to anon, authenticated;

drop policy if exists "stamp_photos_select_public" on public.stamp_photos;
create policy "stamp_photos_select_public" on public.stamp_photos
  for select using (
    public.stamp_is_visible(stamp_id)
    or exists (
      select 1 from public.pilgrimage_stamps s
      where s.id = stamp_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4) 스토리지 갱신 정책에 with check. using 만 있으면 "내 파일"을 골라 남의 uid 폴더 이름으로 바꿀 수 있다.
-- ---------------------------------------------------------------------------
drop policy if exists "pilgrim_photos_update_own" on storage.objects;
create policy "pilgrim_photos_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'pilgrim-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'pilgrim-photos' and (storage.foldername(name))[1] = auth.uid()::text);
