-- 새 가입·로그인을 사장님 디스코드로 바로 알린다 (2026-11-03 사장님 지시: 이메일·이름까지).
--
-- 왜 DB 트리거인가: 이메일·카카오·네이버 로그인이 모두 결국 auth.users 의 행 생성(가입)과
-- last_sign_in_at 갱신(로그인)으로 모인다. 함수 세 개를 고치는 것보다 한 곳에서 본다.
-- 토큰 갱신(자동 로그인 유지)은 last_sign_in_at 을 바꾸지 않으므로 알림이 쏟아지지 않는다.
--
-- 웹후크 주소는 비밀이다(아는 사람은 누구나 채널에 글을 쓸 수 있다) → 저장소에 두지 않고
-- Supabase Vault 에 'discord_webhook_url' 이름으로 넣는다. 없으면 조용히 아무것도 안 한다.
-- 알림이 실패해도 가입·로그인은 절대 막지 않는다(pg_net 은 비동기, 예외는 삼킨다).

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_discord_auth()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  hook text;
  who text;
  how text;
  msg text;
begin
  if tg_op = 'UPDATE' and new.last_sign_in_at is not distinct from old.last_sign_in_at then
    return new;
  end if;

  begin
    select decrypted_secret into hook from vault.decrypted_secrets where name = 'discord_webhook_url' limit 1;
    if hook is null or hook = '' then
      return new;
    end if;

    who := coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'nickname', ''),
      '(이름 없음)'
    );
    how := coalesce(new.raw_user_meta_data ->> 'provider', new.raw_app_meta_data ->> 'provider', 'email');
    msg := format(
      '%s **%s** · %s · %s 로그인 · %s',
      case when tg_op = 'INSERT' then '🆕 새 가입' else '👤 로그인' end,
      who,
      coalesce(new.email, '(이메일 없음)'),
      how,
      to_char(now() at time zone 'Asia/Seoul', 'MM/DD HH24:MI')
    );

    perform net.http_post(
      url := hook,
      body := jsonb_build_object('content', msg, 'allowed_mentions', jsonb_build_object('parse', '[]'::jsonb)),
      headers := '{"Content-Type": "application/json"}'::jsonb
    );
  exception when others then
    raise warning 'notify_discord_auth 건너뜀: %', sqlerrm;
  end;
  return new;
end;
$$;

revoke all on function public.notify_discord_auth() from public, anon, authenticated;

drop trigger if exists on_auth_user_discord_signup on auth.users;
create trigger on_auth_user_discord_signup
  after insert on auth.users
  for each row execute function public.notify_discord_auth();

drop trigger if exists on_auth_user_discord_signin on auth.users;
create trigger on_auth_user_discord_signin
  after update of last_sign_in_at on auth.users
  for each row execute function public.notify_discord_auth();
