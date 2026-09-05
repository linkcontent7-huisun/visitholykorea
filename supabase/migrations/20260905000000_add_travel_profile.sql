-- 순례객 여행 프로필 (2026-09-05)
--
-- 국가 통계(한국관광공사 외래관광객조사)를 뒤져봤지만 "성지순례" 목적도,
-- 개별/단체 여부를 종교 목적자만 따로 뽑을 방법도 없었다. 우리가 직접
-- 물어보지 않으면 어디에도 존재하지 않는 데이터라는 뜻이다.
--
-- 그래서 딱 세 가지만 묻는다 — 많이 물을수록 응답을 안 한다.
--   1) 국적 (country_code)      — 해외 순례객이 실제로 있는지, 어느 나라에서 오는지
--   2) 동행 인원 (companion_count) — 0이면 혼자
--   3) 여행사/가이드 동반 여부 (is_guided_tour) — 개인 순례 vs 단체 패키지
-- 셋 다 nullable. 가입 직후 안 채워도 앱은 그대로 동작해야 한다(스킵 가능).

alter table public.profiles
  add column if not exists country_code text;
alter table public.profiles
  add column if not exists companion_count smallint;
alter table public.profiles
  add column if not exists is_guided_tour boolean;

comment on column public.profiles.country_code is
  'ISO 3166-1 alpha-2 국가코드(예: KR, US, PH). 자유 입력이면 소문자/오타가 섞이므로 앱에서 국가 목록으로 고정해 저장한다.';
comment on column public.profiles.companion_count is
  '나를 제외한 동행 인원. 0 = 혼자 여행. null = 응답 안 함.';
comment on column public.profiles.is_guided_tour is
  '여행사·성지순례 전문 여행사의 가이드 동반 단체에 속해 있는지. null = 응답 안 함.';

-- 스탬프(성지 방문 기록)에도 "이번엔 어떻게 왔는지"를 붙인다.
-- 프로필의 is_guided_tour 는 여행 전체 성격이고, 이건 성지 하나하나마다
-- 달라질 수 있어서 따로 둔다(같은 여행 중에도 어떤 곳은 버스, 어떤 곳은 도보일 수 있다).
alter table public.pilgrimage_stamps
  add column if not exists transport_mode text;

alter table public.pilgrimage_stamps drop constraint if exists pilgrimage_stamps_transport_mode_check;
alter table public.pilgrimage_stamps
  add constraint pilgrimage_stamps_transport_mode_check
  check (transport_mode is null or transport_mode in ('walk', 'public_transit', 'car', 'tour_bus', 'other'));

comment on column public.pilgrimage_stamps.transport_mode is
  '이 성지까지 어떻게 왔는지. walk=도보 · public_transit=대중교통 · car=자가용/택시 · tour_bus=단체 전세버스 · other=기타. null = 응답 안 함.';
