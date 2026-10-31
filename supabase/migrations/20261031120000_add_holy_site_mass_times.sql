-- 성지 미사 시간 (2026-10-31 사장님 지시)
--
-- 미카엘이 「미사 시간」 질문에 Claude 를 부르지 않고 DB 값으로 바로 답하게 하려고 둔다.
-- 미사 시간은 자주 바뀌므로 값만 두지 않고 **언제·어디서** 확인했는지를 같이 둔다.
--
-- 자동 수집(scripts/mass-times-collect.ts)은 성지 홈페이지에서 글을 긁어 오므로 틀릴 수 있다.
-- 그래서 수집값은 mass_times_confirmed = false 로 들어가고, 사장님이 관리자 화면에서
-- 보고 저장해야 true 가 된다. 이용자에게는 true 인 값만 보여 준다(종교 정보는 틀리면 신뢰가 무너진다).
-- 고친 이력은 기존 트리거(record_site_revision)가 칸 구분 없이 site_revisions 에 남긴다.

alter table public.holy_sites
  add column if not exists mass_times text,
  add column if not exists mass_times_checked_on date,
  add column if not exists mass_times_source text,
  add column if not exists mass_times_confirmed boolean not null default false;

comment on column public.holy_sites.mass_times is '미사 시간 원문(예: 평일 07:00, 11:00 / 주일 10:00). 성지 공지 그대로';
comment on column public.holy_sites.mass_times_checked_on is '미사 시간을 확인한 날 — 화면에 「○월 ○일 기준」으로 보인다';
comment on column public.holy_sites.mass_times_source is '확인한 곳(홈페이지 주소 또는 「전화 확인」)';
comment on column public.holy_sites.mass_times_confirmed is '사람이 확인했는가. false 인 자동 수집값은 이용자에게 보이지 않는다';
