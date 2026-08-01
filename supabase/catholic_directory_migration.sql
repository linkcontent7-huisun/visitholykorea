-- catholic_directory: 한국천주교주교회의(CBCK) 공식 주소록(directory.cbck.or.kr) 전체 스크레이핑 결과.
-- holy_sites(195곳, 큐레이션된 추천엔진용 테이블)와는 분리된 얕은 참조용 테이블.
-- 본당/공소/일반기관까지 holy_sites에 섞으면 추천 품질이 떨어지므로 의도적으로 나눔.
-- 2026-08-02 기준 11개 카테고리, 총 5,918건 (본당 1789, 사회복지기관 1056, 기타단체 922,
-- 공소 522, 수도회(여) 504, 교육기관 360, 수도회(남) 224, 피정의집 194, 성지사적지 192,
-- 의료기관 96, 출판보도기관 59). 좌표는 카카오 로컬 API로 지오코딩(약 93% 성공).
-- 자세한 구축 과정은 가톨릭_지식창고/06-데이터베이스/catholic_directory_구축기록.md 참고.

create table if not exists catholic_directory (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  diocese text,
  contact_person text,
  phone text,
  address text,
  lat double precision,
  lng double precision,
  target_gender text, -- '남'|'여'|null(전체/미상). CBCK 주소록엔 없는 정보라 아직 전부 비어있음, 수동 큐레이션 대상
  source_url text,
  created_at timestamptz default now()
);

alter table catholic_directory enable row level security;

drop policy if exists "public read catholic_directory" on catholic_directory;
create policy "public read catholic_directory" on catholic_directory for select using (true);

create index if not exists idx_catholic_directory_category on catholic_directory(category);
create index if not exists idx_catholic_directory_diocese on catholic_directory(diocese);
