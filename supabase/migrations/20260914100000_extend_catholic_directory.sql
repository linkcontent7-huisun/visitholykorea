-- CBCK 공식 주소록의 상세 정보를 보존한다. 기존 주소록 값은 적재기에서 비어 있을 때만 채운다.
alter table public.catholic_directory
  add column if not exists cbck_code text unique,
  add column if not exists district text,
  add column if not exists zipcode text,
  add column if not exists fax text,
  add column if not exists pastor_phone text,
  add column if not exists homepage text,
  add column if not exists email text,
  add column if not exists pastor text,
  add column if not exists pastor_en text,
  add column if not exists founded_on date,
  add column if not exists patron text,
  add column if not exists members_count int,
  add column if not exists mission_count int,
  add column if not exists address_en text,
  add column if not exists name_en text,
  add column if not exists cbck_synced_at timestamptz;
