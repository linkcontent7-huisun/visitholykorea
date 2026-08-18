-- 이미지 출처 표기 + 본당 미사시간 (2026-08-18)
--
-- 1) holy_sites.image_source / image_license
--    Wikimedia Commons CC 라이선스 사진을 쓰려면 출처 표기가 라이선스 의무 사항이다.
--    catholic_directory 가 이미 같은 구조(image_source, image_license)로 관리하고 있어
--    holy_sites 에도 같은 이름으로 맞춘다. TourAPI 유래 이미지는 ADR 0002 에 따라
--    이 테이블에 저장하지 않는다 — 이 컬럼은 그 구분을 기록으로 남기는 장치이기도 하다.
--
-- 2) catholic_directory.mass_times
--    대전교구 공식 홈페이지(church.php)에서 수집한 본당 미사시간.
--    순례자가 실제로 가장 급하게 찾는 정보인데 그동안 담을 자리가 없었다.

alter table public.holy_sites
  add column if not exists image_source text,
  add column if not exists image_license text;

comment on column public.holy_sites.image_source is '이미지 출처 (예: Wikimedia Commons, 직접 촬영). TourAPI 유래는 저장 금지(ADR 0002)';
comment on column public.holy_sites.image_license is '확인된 라이선스만 기록 (예: CC BY-SA 4.0, 공공누리 제1유형)';

alter table public.catholic_directory
  add column if not exists mass_times text;

comment on column public.catholic_directory.mass_times is '미사시간 원문 (교구 공식 홈페이지 수집). 형식 예: ▶평일 - 화/19 ▶주일 - 10:30';
