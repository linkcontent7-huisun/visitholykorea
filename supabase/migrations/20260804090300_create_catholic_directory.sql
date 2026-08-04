-- catholic_directory: 한국천주교주교회의(CBCK) 공식 주소록(directory.cbck.or.kr) 스크레이핑 결과.
--
-- holy_sites(195곳, 큐레이션된 추천엔진용 테이블)와 의도적으로 분리했다.
-- 본당·공소·일반기관까지 holy_sites 에 섞으면 추천 품질이 떨어지기 때문이다.
-- 이 테이블은 "찾아보기"용 얕은 참조 데이터고, 추천 엔진은 건드리지 않는다.
--
-- 2026-08-02 기준 11개 카테고리, 총 5,918건 (본당 1789, 사회복지기관 1056, 기타단체 922,
-- 공소 522, 수도회(여) 504, 교육기관 360, 수도회(남) 224, 피정의집 194, 성지사적지 192,
-- 의료기관 96, 출판보도기관 59). 좌표는 카카오 로컬 API 지오코딩(약 93% 성공).
-- 구축 과정은 docs/40-knowledge/06-데이터베이스/catholic_directory_구축기록.md 참고.

create table if not exists public.catholic_directory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  diocese text,
  contact_person text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  -- '남'|'여'|null(전체·미상). CBCK 주소록에 없는 정보라 아직 비어 있고, 수동 큐레이션 대상이다.
  target_gender text,
  source_url text,
  created_at timestamptz default now(),

  -- 2026-08-02 추가: 피정의집(194)·성지사적지(192) 386건에 한해 배경 조사로 채운 콘텐츠.
  -- 나머지 카테고리(본당·공소·기관 등)는 비어 있는 게 정상이다 — 실제로 노출되는
  -- 두 카테고리만 우선 채웠다. 설명 340/386건, 라이선스 확인된 사진 81/386건.
  description text,
  image_url text,
  image_source text, -- 'Wikimedia Commons' | 'TourAPI' 등
  image_license text -- 'CC BY-SA 4.0' | '공공누리 제1유형' 등 — 확인된 라이선스만 기록한다
);

alter table public.catholic_directory enable row level security;

drop policy if exists "catholic_directory_public_read" on public.catholic_directory;
create policy "catholic_directory_public_read" on public.catholic_directory
  for select using (true);

create index if not exists catholic_directory_category_idx on public.catholic_directory (category);
create index if not exists catholic_directory_diocese_idx on public.catholic_directory (diocese);
