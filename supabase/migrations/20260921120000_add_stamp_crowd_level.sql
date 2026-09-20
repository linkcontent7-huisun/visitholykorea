-- 순례 기록에 「그날 붐볐나요?」 한 칸 (2026-09-21)
--
-- 관광공사 집중률은 예측값이고, 성지 이름으로 등재된 32곳(9/21 실측) 외에는 성지 자체 값이 없다.
-- 예측이 맞는지 대조할 실측이 우리에게 0건이라, 다녀온 사람이 남기는 체감 한 칸을 받는다.
-- 안 골라도(null) 기록은 저장된다. 기존 행은 전부 null 로 남는다 — 기본값·backfill 없음.
--
-- ⚠ 열만 넣고 아래 GRANT 를 빠뜨리면 20260914130000 의 열 단위 권한 때문에 앱의 insert 가
--   통째로 42501 로 거부된다(새 칸만 안 되는 게 아니라 기록 저장 자체가 실패). 반드시 같이 간다.
--
-- 여러 번 돌려도 안전하다.

alter table public.pilgrimage_stamps
  add column if not exists crowd_level text;

alter table public.pilgrimage_stamps drop constraint if exists pilgrimage_stamps_crowd_level_check;
alter table public.pilgrimage_stamps
  add constraint pilgrimage_stamps_crowd_level_check
  check (crowd_level is null or crowd_level in ('quiet', 'moderate', 'crowded'));

comment on column public.pilgrimage_stamps.crowd_level is
  '방문 당시 체감 붐빔. quiet=한적 · moderate=보통 · crowded=붐빔. null = 응답 안 함. 관광공사 집중률 예측을 검증하는 실측값.';

-- grant 는 누적이라 기존 열 권한은 그대로다. 20260914130000 의 목록 + crowd_level.
grant insert (user_id, site_id, note, photo_url, transport_mode, visited_on, crowd_level)
  on public.pilgrimage_stamps to authenticated;
grant update (note, photo_url, transport_mode, visited_on, crowd_level)
  on public.pilgrimage_stamps to authenticated;
