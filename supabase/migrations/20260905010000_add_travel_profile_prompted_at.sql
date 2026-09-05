-- 여행 프로필 질문을 이미 한 번 보여줬는지 (2026-09-05)
--
-- country_code/companion_count/is_guided_tour 가 셋 다 null 인 건 "스킵했다"와
-- "아직 한 번도 안 물어봤다"를 구분 못 한다. 구분 못 하면 로그인할 때마다
-- 또 물어보게 된다. 그래서 "물어본 적 있다"는 별도로 남긴다.

alter table public.profiles
  add column if not exists travel_profile_prompted_at timestamptz;

comment on column public.profiles.travel_profile_prompted_at is
  '여행 프로필 온보딩 시트를 처음(또는 마지막으로) 보여준 시각. 답했든 건너뛰었든 값이 생기면 다시 안 띄운다.';
