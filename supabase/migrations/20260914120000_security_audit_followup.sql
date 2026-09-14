-- 보안 진단(팀원, 2026-09-13) 후속 — H-02 주소록 공개 뷰 + C-01 트리거 조건 보정 (2026-09-14)
--
-- 1) C-01 보정: 20260914110000 의 트리거는 JWT 의 role 클레임이 service_role 이 아니면 전부 막았다.
--    그러면 노트북 직결(npm run admin:grant, postgres 역할 — JWT 없음)까지 막혀 관리자 지정이 안 된다.
--    팀원 패치처럼 「PostgREST 가 anon/authenticated 로 실행할 때만」 막는 조건으로 바꾼다.
--
-- 2) H-02: catholic_directory 5,918건(T-019 로 주임신부·전화·이메일까지 늘어남)이 anon 에게 전 열
--    읽기로 열려 있었다. 원본 표 읽기를 걷고, 앱이 실제 쓰는 열·분류만 담은 뷰 directory_public 을 준다.
--    앱(directory.repository.ts)·AI 가이드(ai-guide)는 뷰만 읽는다. 스크립트(cbck-load 등)는 postgres 직결이라 무관.
--    security_invoker 를 쓰지 않는다(기본 = 소유자 권한) — 원본 직접 권한이 없는 anon 도 뷰를 통해서만 읽는다.
--
-- 여러 번 돌려도 안전하다.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 앱(PostgREST anon/authenticated)에서 온 요청만 막는다. 노트북 직결(postgres)·Edge Function(service_role)은 통과.
  if current_setting('role', true) in ('anon', 'authenticated')
     and (new.role is distinct from old.role or new.diocese is distinct from old.diocese) then
    raise exception '권한(role)·담당 교구는 사용자가 바꿀 수 없습니다.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke select on public.catholic_directory from anon, authenticated;

drop view if exists public.directory_public;
create view public.directory_public as
  select id, name, name_compact, category, diocese, phone, address, lat, lng,
         name_romanized, address_romanized
  from public.catholic_directory
  where category in ('본당', '공소', '피정의집');

grant select on public.directory_public to anon, authenticated;
