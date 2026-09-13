-- 자료의 근거와 익명 이용 흐름을 분리해 남긴다.
-- TourAPI 응답은 저장하지 않는다. site_sources 는 앱이 직접 수집한 성지 자료의 출처만 기록한다.
-- 보관 정책: events 의 1년 지난 행은 관리자가 지운다(추후 cron).

-- ---------------------------------------------------------------------------
-- 1) 성지 자료 출처
-- ---------------------------------------------------------------------------
create table if not exists public.site_sources (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.holy_sites (id) on delete cascade,
  kind text not null check (kind in ('web', 'book', 'field', 'ai_draft', 'user')),
  title text not null,
  url text,
  collected_at date,
  collected_by text,
  note text,
  created_at timestamptz not null default now()
);

-- 같은 성지에 같은 출처를 재시드해도 중복 행이 쌓이지 않게 한다.
create unique index if not exists site_sources_site_kind_title_key
  on public.site_sources (site_id, kind, title);

alter table public.site_sources enable row level security;

drop policy if exists "site_sources_public_read" on public.site_sources;
create policy "site_sources_public_read" on public.site_sources
  for select using (true);

-- 출처를 고치는 권한은 성지 본문을 고치는 권한과 맞춘다. 출처만 따로 넓히면 근거가 바뀔 수 있다.
drop policy if exists "site_sources_editor_insert" on public.site_sources;
create policy "site_sources_editor_insert" on public.site_sources
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.holy_sites s
      where s.id = site_id
        and public.can_edit_site(s.diocese)
    )
  );

drop policy if exists "site_sources_editor_update" on public.site_sources;
create policy "site_sources_editor_update" on public.site_sources
  for update to authenticated
  using (
    exists (
      select 1 from public.holy_sites s
      where s.id = site_id and public.can_edit_site(s.diocese)
    )
  )
  with check (
    exists (
      select 1 from public.holy_sites s
      where s.id = site_id and public.can_edit_site(s.diocese)
    )
  );

drop policy if exists "site_sources_editor_delete" on public.site_sources;
create policy "site_sources_editor_delete" on public.site_sources
  for delete to authenticated
  using (
    exists (
      select 1 from public.holy_sites s
      where s.id = site_id and public.can_edit_site(s.diocese)
    )
  );

-- 서울 순례길 미사 시간 자료의 출처. 이름이 맞지 않으면 join 에서 빠지고 아래 검증이 막는다.
insert into public.site_sources (site_id, kind, title, collected_at, collected_by, note)
select s.id, 'book', '천주교 서울 순례길 안내 책자 (서울대교구, 2025-11-30 기준)',
  date '2026-09-12', '사장님 촬영 / Claude 판독', '미사 시간·연락처·코스 설명'
from (values
  ('명동대성당'), ('가회동 성당'), ('광희문 성지'), ('노고산 성지'),
  ('당고개순교성지'), ('삼성산 성지'), ('새남터순교성지'), ('서소문 밖 네거리 순교성지'),
  ('용산 예수 성심 신학교'), ('왜고개 성지'), ('절두산 순교성지'), ('종로 성당'),
  ('약현성당 (중림동성당)')
) as v(name)
join public.holy_sites s on s.name = v.name
on conflict (site_id, kind, title) do nothing;

-- 최양업 순례길 역사 문단의 출처.
insert into public.site_sources (site_id, kind, title, collected_at, note)
select s.id, 'book', '가경자 최양업 토마스 신부 시복시성 기원 순례 여권 책자',
  date '2026-09-12', '최양업 신부와의 인연 문단·코스 경유 메모'
from (values
  ('다락골 성지'), ('진산 성지'), ('수리산 성지'), ('당고개순교성지'),
  ('은이 성지'), ('배티 순교성지'), ('진안리 성지'), ('배론성지')
) as v(name)
join public.holy_sites s on s.name = v.name
on conflict (site_id, kind, title) do nothing;

-- 대표 사진의 기존 표기 자체를 출처로 옮겨, 사진만 보고 근거가 사라지지 않게 한다.
insert into public.site_sources (site_id, kind, title, note)
select s.id, 'web', s.image_source, '대표 사진'
from public.holy_sites s
where coalesce(s.image_source, '') <> ''
on conflict (site_id, kind, title) do nothing;

do $$
declare
  source_count integer;
begin
  select count(*) into source_count from public.site_sources;
  if source_count < 20 then
    raise exception 'site_sources 시드가 20행보다 적습니다: %', source_count;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) 익명 접속 기록. 사용자 이름·이메일은 남기지 않는다.
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  visitor_id text not null,
  user_id uuid references auth.users (id) on delete set null,
  kind text not null check (kind in ('view_site', 'search', 'view_route', 'stamp', 'ai_ask', 'compass_done', 'install')),
  target_id uuid,
  query text,
  language text,
  device text
);

create index if not exists events_occurred_at_idx on public.events (occurred_at desc);
create index if not exists events_kind_occurred_at_idx on public.events (kind, occurred_at desc);
create index if not exists events_target_id_idx on public.events (target_id);

alter table public.events enable row level security;

drop policy if exists "events_anon_insert" on public.events;
create policy "events_anon_insert" on public.events
  for insert to anon, authenticated
  with check (visitor_id <> '' and (user_id is null or user_id = auth.uid()));

drop policy if exists "events_admin_read" on public.events;
create policy "events_admin_read" on public.events
  for select to authenticated
  using (public.admin_role() = 'admin');

-- update/delete 정책은 일부러 만들지 않는다. 기록의 신뢰성과 개인정보 보관은 관리자가 별도 절차로 다룬다.

-- ---------------------------------------------------------------------------
-- 3) 성지별 번역 채움 현황. security_invoker 로 원본 표의 RLS를 그대로 따른다.
-- ---------------------------------------------------------------------------
create or replace view public.translation_coverage
with (security_invoker = true)
as
select
  s.id as site_id,
  s.name,
  s.diocese,
  coalesce(bool_or(t.language = 'en' and coalesce(t.name, '') <> ''), false) as has_en,
  coalesce(bool_or(t.language = 'es' and coalesce(t.name, '') <> ''), false) as has_es,
  coalesce(bool_or(t.language = 'fr' and coalesce(t.name, '') <> ''), false) as has_fr,
  coalesce(bool_or(t.language = 'pt' and coalesce(t.name, '') <> ''), false) as has_pt,
  coalesce(bool_or(t.language = 'it' and coalesce(t.name, '') <> ''), false) as has_it,
  coalesce(bool_or(t.language = 'en' and coalesce(t.history, '') <> ''), false) as has_en_history
from public.holy_sites s
left join public.holy_site_translations t on t.site_id = s.id
group by s.id, s.name, s.diocese;
