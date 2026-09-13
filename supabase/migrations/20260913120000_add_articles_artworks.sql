-- 기사 원문 대신 검증 가능한 서지·요약·사실만 보관해 저작권 경계를 지킨다.
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('catholicnews', 'cpbc', 'catholictimes', 'other')),
  url text not null unique,
  title text not null,
  published_at date,
  author text,
  summary text,
  excerpt text check (excerpt is null or char_length(excerpt) <= 200),
  topics text[] not null default '{}',
  facts jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'reviewed', 'used', 'skip')),
  check (topics <@ array['pilgrimage_route', 'pilgrimage_record', 'statue', 'stained_glass', 'relic', 'sculpture', 'artwork', 'architecture', 'shrine_news']::text[])
);

create table if not exists public.article_sites (
  article_id uuid not null references public.articles (id) on delete cascade,
  site_id uuid not null references public.holy_sites (id) on delete cascade,
  confidence real not null check (confidence >= 0 and confidence <= 1),
  primary key (article_id, site_id)
);

create table if not exists public.site_artworks (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.holy_sites (id) on delete cascade,
  kind text not null check (kind in ('statue', 'stained_glass', 'relic', 'sculpture', 'painting', 'architecture', 'other')),
  title text not null,
  artist text,
  year text,
  description text,
  article_id uuid references public.articles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (site_id, kind, title, article_id)
);

alter table public.articles enable row level security;
alter table public.article_sites enable row level security;
alter table public.site_artworks enable row level security;

drop policy if exists "articles_public_read" on public.articles;
create policy "articles_public_read" on public.articles for select using (true);
drop policy if exists "article_sites_public_read" on public.article_sites;
create policy "article_sites_public_read" on public.article_sites for select using (true);
drop policy if exists "site_artworks_public_read" on public.site_artworks;
create policy "site_artworks_public_read" on public.site_artworks for select using (true);

-- 편집 권한을 세 표에 똑같이 적용해야 기사와 연결 관계가 엇갈리지 않는다.
drop policy if exists "articles_editor_write" on public.articles;
create policy "articles_editor_write" on public.articles for all to authenticated
  using (public.admin_role() in ('admin', 'editor')) with check (public.admin_role() in ('admin', 'editor'));
drop policy if exists "article_sites_editor_write" on public.article_sites;
create policy "article_sites_editor_write" on public.article_sites for all to authenticated
  using (public.admin_role() in ('admin', 'editor')) with check (public.admin_role() in ('admin', 'editor'));
drop policy if exists "site_artworks_editor_write" on public.site_artworks;
create policy "site_artworks_editor_write" on public.site_artworks for all to authenticated
  using (public.admin_role() in ('admin', 'editor')) with check (public.admin_role() in ('admin', 'editor'));
