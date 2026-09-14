-- 띄어쓰기에 무관한 이름 검색 (2026-09-13)
--
-- 사장님이 AI 가이드에 「대산성당」이라고 물었는데 DB 이름은 「대산 성당 복자 구한선 타대오 성지」라
-- ilike 부분 일치가 안 됐다. 이름에서 공백을 뺀 열을 자동 생성해 두고, 검색어도 공백을 빼서 맞춘다.
-- 검색 화면·AI 가이드·주소록 검색이 같이 쓴다.

alter table public.holy_sites
  add column if not exists name_compact text generated always as (replace(name, ' ', '')) stored;
create index if not exists holy_sites_name_compact_idx on public.holy_sites (name_compact);

alter table public.catholic_directory
  add column if not exists name_compact text generated always as (replace(name, ' ', '')) stored;
create index if not exists catholic_directory_name_compact_idx on public.catholic_directory (name_compact);
