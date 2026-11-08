-- 체험여행 돌발 퀴즈 → 포인트 기본형 (2026-11-08 사장님 지시 — 제안서 §4 6번 「퀴즈 팝업과 포인트 적립」)
--
-- 포인트는 접수 한 건(나의 체험 링크)에 쌓인다. 회원가입 없음.
-- 한 문제는 한 번만(기본키), 한 문제 최대 10점. 직접 쓰기는 막고 함수로만 기록한다.
-- 시연용 기본형이라 정답 판정은 화면이 하고 DB 는 「한 번만·최대 10점」만 지킨다(이후 단계에서 서버 판정).

create table if not exists public.program_points (
  application_id uuid not null references public.program_applications (id) on delete cascade,
  quiz_id text not null check (quiz_id ~ '^[a-z0-9-]{1,40}$'),
  points smallint not null check (points between 0 and 10),
  created_at timestamptz not null default now(),
  primary key (application_id, quiz_id)
);

alter table public.program_points enable row level security;

drop policy if exists program_points_admin_select on public.program_points;
create policy program_points_admin_select on public.program_points
  for select using (public.admin_role() = 'admin');

grant select on public.program_points to authenticated;

-- 퀴즈 답 기록 — 접수 id 를 아는 사람(링크 소유자)만. 돌려주는 값 = 그 접수의 포인트 합계
create or replace function public.answer_program_quiz(p_id uuid, p_quiz text, p_correct boolean)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  total integer;
begin
  if not exists (select 1 from program_applications where id = p_id) then
    raise exception 'application not found';
  end if;
  insert into program_points (application_id, quiz_id, points)
  values (p_id, p_quiz, case when p_correct then 10 else 0 end)
  on conflict do nothing;
  select coalesce(sum(points), 0) into total from program_points where application_id = p_id;
  return total;
end;
$$;

revoke all on function public.answer_program_quiz(uuid, text, boolean) from public;
grant execute on function public.answer_program_quiz(uuid, text, boolean) to anon, authenticated;

-- 나의 체험 링크 함수에 포인트 합계·푼 문제 목록을 더한다(돌려주는 칸이 바뀌어 다시 만든다)
drop function if exists public.get_my_program_application(uuid);

create function public.get_my_program_application(p_id uuid)
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
  created_at timestamptz,
  points integer,
  answered text[]
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
         a.created_at,
         coalesce((select sum(p.points)::integer from program_points p where p.application_id = a.id), 0),
         coalesce((select array_agg(p.quiz_id) from program_points p where p.application_id = a.id), '{}')
    from public.program_applications a
   where a.id = p_id;
$$;

revoke all on function public.get_my_program_application(uuid) from public;
grant execute on function public.get_my_program_application(uuid) to anon, authenticated;
