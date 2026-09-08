-- catholic_directory 로마자 표기 (2026-09-07)
--
-- 5,918건이 한국천주교주교회의 주소록에서 그대로 긁어온 한국어 원문뿐이라,
-- 외국어 화면에서 검색도 못 하고 읽지도 못한다는 피드백(2026-09-07)에 대한 답.
-- 208곳 성지처럼 사람이 확인한 번역을 5,918건 전부에 만드는 대신, 국립국어원
-- 표기법(로마자 표기법, 2000년 고시)을 기계적으로 적용한 값을 채운다
-- (변환기: src/shared/lib/korean-romanize.ts, 채우는 스크립트: scripts/romanize-directory.ts).
--
-- 사람이 감수한 값이 아니라는 것을 숨기지 않는다 — 화면에서 name_romanized 를 쓸 때는
-- "자동 로마자 표기"임을 함께 밝힌다.

alter table public.catholic_directory
  add column if not exists name_romanized text,
  add column if not exists address_romanized text;

comment on column public.catholic_directory.name_romanized is '이름의 기계적 로마자 표기(국립국어원 표기법). 사람이 감수하지 않았다 — scripts/romanize-directory.ts 로 채움';
comment on column public.catholic_directory.address_romanized is '주소의 기계적 로마자 표기. 위와 같은 방식·같은 한계';
