-- 도슨트 원고를 DB 에 둔다 (2026-09-17 사장님 지시: "사진과 안내 설명글은 전부 DB 화").
-- 그동안 원고는 저장소 data/docent/*.json 에 있었다 — 현장조사 결과라 코드와 함께 두려던 설계였는데,
-- 사장님이 Supabase 에서 직접 읽고 고칠 수 있어야 하므로 표로 옮긴다.
--
-- kind:
--   intro  「소개글」 — 역사·건축 배경·인물을 한 편으로. 가기 전에 듣거나 도착해서 듣는다 (500~1,000자)
--   point  「지금 이야기」 — 마당에 서서 바로 찾아볼 수 있는 것(건축미·성모상·성물·예술품). seq 순서로 3~5개
-- language: 'ko' 가 원본. 'en' 등은 같은 site_id·kind·seq 에 다른 행으로.
-- status: draft(문헌 초안) → reviewed(사장님 감수) → verified(현장 확인)

create table if not exists public.docent_scripts (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references public.holy_sites(id) on delete cascade,
  language    text not null default 'ko' check (language in ('ko','en','es','fr','pt','it')),
  kind        text not null check (kind in ('intro','point')),
  seq         integer not null default 0,
  title       text,
  body        text not null,
  look_for    text,                       -- 지점에서 눈여겨볼 디테일 한 가지 (point 전용)
  sources     jsonb not null default '[]', -- 근거 목록: [{"label":"가톨릭신문 2017-07","url":"…"}]
  status      text not null default 'draft' check (status in ('draft','reviewed','verified')),
  written_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (site_id, language, kind, seq)
);

comment on table  public.docent_scripts is '도슨트 원고 — language=ko 가 「한글 도슨트 원고」. kind=intro 소개글, kind=point 지금 이야기(지점)';
comment on column public.docent_scripts.body is '낭독문. 안내자 1인칭 존댓말(~보세요, ~입니다). TTS 로 읽히므로 숫자는 한글로';
comment on column public.docent_scripts.sources is '근거. 출처 없는 숫자·이름은 원고에 쓰지 않는다 (CLAUDE.md)';

create index if not exists docent_scripts_site_lang_idx on public.docent_scripts (site_id, language, kind, seq);

-- 읽기는 누구나(앱이 낭독), 쓰기는 서비스 키·관리자만
alter table public.docent_scripts enable row level security;

drop policy if exists "docent_scripts_read" on public.docent_scripts;
create policy "docent_scripts_read" on public.docent_scripts
  for select using (true);

drop policy if exists "docent_scripts_admin_write" on public.docent_scripts;
create policy "docent_scripts_admin_write" on public.docent_scripts
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- updated_at 자동 갱신
create or replace function public.docent_scripts_touch() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists docent_scripts_touch on public.docent_scripts;
create trigger docent_scripts_touch before update on public.docent_scripts
  for each row execute function public.docent_scripts_touch();
