-- 권한 상승 차단 (2026-09-14, 팀원 보안 보고)
--
-- profiles 의 update 정책은 "본인 행"만 검사하고 어느 열인지는 보지 않는다. Supabase 는 기본으로
-- authenticated 에 public 표 UPDATE 전권을 주므로, 가입한 누구나 자기 role 을 'admin' 으로 바꿀 수 있었다.
-- 1) 열 단위 GRANT 로 사용자가 고칠 수 있는 열을 명시한다 (role·diocese·email·provider·id 제외)
-- 2) 트리거로 role·diocese 변경을 한 번 더 막는다 — GRANT 가 나중에 다시 넓어져도 안전
-- 관리자 지정은 계속 service_role 로 도는 scripts/grant-admin.ts (npm run admin:grant) 가 한다.

revoke update on public.profiles from anon, authenticated;
grant update (name, country_code, companion_count, is_guided_tour, travel_profile_prompted_at)
  on public.profiles to authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- service_role(서버 스크립트)은 통과, 그 외에는 role·diocese 를 못 바꾼다
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    if new.role is distinct from old.role or new.diocese is distinct from old.diocese then
      raise exception '권한(role)·담당 교구는 사용자가 바꿀 수 없습니다.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- update 정책에도 with check 를 붙여 "본인 행"을 벗어나는 갱신을 막는다
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
