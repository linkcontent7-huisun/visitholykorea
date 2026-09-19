-- 순례 코스 본문 번역.
--
-- holy_site_translations 와 같은 구조다 — 원문(한국어)은 pilgrimage_routes /
-- pilgrimage_route_sites 에 그대로 두고, 여기엔 번역만 쌓는다. 번역이 없으면
-- 앱은 한국어 원문으로 떨어진다(폴백).
--
-- 코스 제목·부제·설명과, 경유지별 "이 코스에서의 의미"(note)는 갱신 주기가
-- 다르지 않고 함께 관리되므로 표 둘로 나눈다: 코스 자체, 코스의 경유지.

create table if not exists public.pilgrimage_route_translations (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.pilgrimage_routes(id) on delete cascade,

  language text not null,

  title text,
  subtitle text,
  description text,

  translation_status text not null default 'machine'
    check (translation_status in ('machine', 'reviewed')),
  reviewed_by text,
  reviewed_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (route_id, language)
);

create index if not exists pilgrimage_route_translations_lang_idx
  on public.pilgrimage_route_translations (language);

alter table public.pilgrimage_route_translations enable row level security;

drop policy if exists "route_translations_public_read" on public.pilgrimage_route_translations;
create policy "route_translations_public_read" on public.pilgrimage_route_translations
  for select using (true);

-- 경유지가 "이 코스에서" 갖는 의미(note) 번역. site_id 는 holy_sites 를 그대로
-- 참조한다 — 성지 이름 자체의 번역은 holy_site_translations 가 이미 맡는다.
create table if not exists public.pilgrimage_route_site_translations (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.pilgrimage_routes(id) on delete cascade,
  site_id uuid not null references public.holy_sites(id) on delete cascade,

  language text not null,
  note text,

  translation_status text not null default 'machine'
    check (translation_status in ('machine', 'reviewed')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (route_id, site_id, language)
);

create index if not exists pilgrimage_route_site_translations_lang_idx
  on public.pilgrimage_route_site_translations (language);

alter table public.pilgrimage_route_site_translations enable row level security;

drop policy if exists "route_site_translations_public_read" on public.pilgrimage_route_site_translations;
create policy "route_site_translations_public_read" on public.pilgrimage_route_site_translations
  for select using (true);
