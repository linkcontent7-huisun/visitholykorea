-- 성지 마스터 테이블.
-- 앱이 직접 수집·큐레이션한 자체 데이터다(TourAPI 응답이 아니므로 저장·캐싱에 제약이 없다).
-- 실제 성지 데이터는 supabase/seed/01_holy_sites.sql 로 분리해 두었다.

create table if not exists public.holy_sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  diocese text,
  region_province text,
  location text,
  description text,
  history text,
  image_url text,
  lat double precision,
  lng double precision,
  seo_title text,
  seo_description text,
  emotion_tag text,
  nearby_attractions text,
  nearby_lodging text,
  created_at timestamptz not null default now()
);

-- 같은 성지가 두 번 들어가는 사고를 막는다(시드 재실행 시에도 안전).
create unique index if not exists holy_sites_name_location_key
  on public.holy_sites (name, coalesce(location, ''));

-- 화면에서 가장 자주 쓰는 필터 축들.
create index if not exists holy_sites_diocese_idx on public.holy_sites (diocese);
create index if not exists holy_sites_emotion_tag_idx on public.holy_sites (emotion_tag);
create index if not exists holy_sites_category_idx on public.holy_sites (category);

alter table public.holy_sites enable row level security;

-- 성지 정보는 누구나 읽을 수 있다. 쓰기는 service_role(관리자)만 가능하다
-- (RLS 가 켜져 있고 insert/update/delete 정책이 없으므로 anon 키로는 수정할 수 없다).
drop policy if exists "holy_sites_public_read" on public.holy_sites;
create policy "holy_sites_public_read" on public.holy_sites
  for select using (true);
