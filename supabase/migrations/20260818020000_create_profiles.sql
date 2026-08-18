-- 회원 프로필 (2026-08-18)
--
-- 로그인 자격 증명(이메일·비밀번호 해시)은 Supabase 가 관리하는 auth.users 에 있다.
-- 이 테이블은 앱이 읽고 쓸 수 있는 "회원 정보의 공개된 얼굴"이다 — 가입하면
-- 트리거가 자동으로 한 줄을 만들고, 이름 표시·가입 경로 통계 등에 쓴다.
-- 비밀번호는 여기 저장되지 않는다(해시조차도). 그건 auth 스키마의 일이다.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  -- 가입 경로: email | kakao | google | facebook | naver
  provider text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- 본인 것만 읽고 고칠 수 있다. 다른 회원의 이메일이 보여서는 안 된다.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- 가입(auth.users 삽입)과 동시에 프로필을 만든다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, provider)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이 마이그레이션 이전에 가입한 사용자 백필
insert into public.profiles (id, email, name, provider)
select id, email,
       coalesce(raw_user_meta_data ->> 'name', ''),
       coalesce(raw_app_meta_data ->> 'provider', 'email')
  from auth.users
on conflict (id) do nothing;
