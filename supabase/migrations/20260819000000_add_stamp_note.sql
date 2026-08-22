-- 스탬프에 "한 줄 기록"을 붙인다 (공모전 컨셉 축 3).
--
-- 붐빔 지수는 어디까지나 추정이다. 실제로 조용했는지는 다녀온 사람만 안다.
-- 그래서 스탬프를 찍을 때 한 줄을 남길 수 있게 하고, 그 한 줄이
-- 다음 방문자의 판단 근거가 된다 — "평일 오후, 저 말고 아무도 없었어요."
--
-- 이 파일도 다른 마이그레이션처럼 여러 번 돌려도 안전해야 한다(러너 규칙).

alter table public.pilgrimage_stamps
  add column if not exists note text;

-- "한 줄"이라는 약속을 DB 가 지킨다. 화면 검증만 믿으면 언젠가 뚫린다.
alter table public.pilgrimage_stamps
  drop constraint if exists pilgrimage_stamps_note_length;
alter table public.pilgrimage_stamps
  add constraint pilgrimage_stamps_note_length
  check (note is null or char_length(note) <= 120);

-- 본인이 자기 한 줄을 고칠 수 있어야 한다 (기존 정책은 select/insert/delete 뿐).
drop policy if exists "stamps_update_own" on public.pilgrimage_stamps;
create policy "stamps_update_own" on public.pilgrimage_stamps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 다음 사람이 읽을 수 있어야 루프가 돈다. 다만 "누가 어디를 다녀갔는가"는
-- 사생활이므로, user_id 를 뺀 뷰로만 공개한다. 뷰는 소유자 권한으로 실행되어
-- 기본 테이블의 RLS(본인 것만 select)를 우회하는데, 여기서는 그게 의도다 —
-- 노출 범위를 이 세 컬럼으로 좁히는 장치가 바로 이 뷰이기 때문이다.
create or replace view public.site_visit_notes as
  select site_id, note, created_at
  from public.pilgrimage_stamps
  where note is not null;

grant select on public.site_visit_notes to anon, authenticated;
