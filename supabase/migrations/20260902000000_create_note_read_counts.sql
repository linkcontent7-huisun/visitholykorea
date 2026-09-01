-- 한 줄 기록이 "몇 명에게 읽혔는지"를 센다 (넛지 기획 5번 — Kudos 의 조용한 버전).
--
-- 다녀온 사람이 남긴 한 줄이 다음 사람에게 실제로 읽히고 있음을 글쓴이가
-- 알게 되면, 경쟁 없이도 계속 남길 이유가 생긴다. 누가 읽었는지는 저장하지
-- 않는다 — 숫자 하나면 충분하고, 읽는 사람의 발자국을 남기는 건 과하다.
--
-- 이 파일도 다른 마이그레이션처럼 여러 번 돌려도 안전해야 한다(러너 규칙).

create table if not exists public.note_read_counts (
  stamp_id uuid primary key references public.pilgrimage_stamps(id) on delete cascade,
  read_count integer not null default 0
);

alter table public.note_read_counts enable row level security;

-- 글쓴이 본인만 자기 한 줄의 읽힘 수를 본다. 남의 조회수는 비교거리가 되므로
-- 공개하지 않는다 — 이 기능은 랭킹이 아니라 "읽혔다"는 확인이다.
drop policy if exists "note_reads_select_own" on public.note_read_counts;
create policy "note_reads_select_own" on public.note_read_counts
  for select using (
    exists (
      select 1 from public.pilgrimage_stamps s
      where s.id = stamp_id and s.user_id = auth.uid()
    )
  );

-- 증가는 이 함수로만 한다. 화면에 실제로 보여준 최신 p_limit 개(성지 상세의
-- "다녀온 사람의 한 줄" 노출 개수)와 같은 행만 +1 — 안 보인 한 줄은 안 센다.
-- security definer 라 익명 방문자도 카운트를 올릴 수 있지만, 올리는 것 외에는
-- 아무것도 못 한다(반환값 없음, 대상 행은 서버가 정한다).
create or replace function public.increment_note_reads(p_site_id uuid, p_limit integer default 3)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.note_read_counts (stamp_id, read_count)
  select s.id, 1
  from public.pilgrimage_stamps s
  where s.site_id = p_site_id and s.note is not null
  order by s.created_at desc
  limit greatest(1, least(p_limit, 10))
  on conflict (stamp_id) do update set read_count = note_read_counts.read_count + 1;
$$;

grant execute on function public.increment_note_reads(uuid, integer) to anon, authenticated;
