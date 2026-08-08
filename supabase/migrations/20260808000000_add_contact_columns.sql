-- 성지 연락처 — 전화번호 · 홈페이지 · 팩스.
--
-- 순례자가 실제로 필요로 하는 건 감성 문구보다 "미사 시간을 어디로 물어보나"다.
-- Buen Camino 앱(4.8★, 리뷰 1.69만)도 구간 상세 안에 미사 시간과 숙소 연락처를 넣는다.
-- 자세한 조사는 docs/20-architecture/UI-레퍼런스.md 4장.
--
-- 이 데이터는 예전 Supabase 프로젝트(stdmbtyppkyncasplmae)에 남아 있던 것이다.
-- 프로젝트가 둘로 갈라져 있었고, 그쪽에만 130곳의 연락처가 채워져 있었다.
-- 그 프로젝트를 지우기 전에 여기로 옮긴다. 값은 scripts/import-contacts.ts 로 넣는다.
--
-- 팩스를 함께 가져오는 이유 — 성지 사무실은 아직 팩스로 순례 단체 예약을 받는 곳이 있다.
-- 쓸 일이 없어 보여도 이미 수집된 값을 버릴 이유는 없다.

alter table public.holy_sites
  add column if not exists phone text,
  add column if not exists homepage_url text,
  add column if not exists fax text;
