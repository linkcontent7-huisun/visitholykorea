-- 체험여행 「나의 체험 링크」 (2026-11-08 사장님 지시 — 아이디어 취지: 링크 하나로 모든 정보)
--
-- 접수가 끝나면 참가자마다 /my/<접수 id> 링크가 생긴다. 회원가입 없이 이 링크로 당일 안내를 본다.
-- 표 자체는 여전히 관리자만 읽는다. 이 함수는 접수 id(추측할 수 없는 무작위 값)를 아는 사람에게
-- 그 한 줄의 「필요한 칸만」 돌려준다. 연락처는 돌려주지 않고, 이름은 첫 글자만 보인다.

create or replace function public.get_my_program_application(p_id uuid)
returns table (
  id uuid,
  program_slug text,
  course text,
  visit_date date,
  name_masked text,
  adults smallint,
  children smallint,
  seniors smallint,
  notice_consent boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.id,
         a.program_slug,
         a.course,
         a.visit_date,
         left(a.contact_name, 1) || repeat('*', greatest(char_length(a.contact_name) - 1, 1)),
         a.adults,
         a.children,
         a.seniors,
         a.notice_consent,
         a.created_at
    from public.program_applications a
   where a.id = p_id;
$$;

revoke all on function public.get_my_program_application(uuid) from public;
grant execute on function public.get_my_program_application(uuid) to anon, authenticated;
