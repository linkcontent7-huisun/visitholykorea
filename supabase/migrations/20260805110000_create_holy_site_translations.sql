-- 성지 본문 번역.
--
-- 화면 문구(버튼·라벨)는 코드의 사전(`shared/i18n/dictionary.ts`)에 있고,
-- 성지 설명·역사 같은 **콘텐츠**는 여기 있다. 둘은 갱신 주기가 완전히 다르다 —
-- 문구는 배포할 때 바뀌고, 콘텐츠는 취재하면서 계속 늘어난다. 섞으면 둘 다 관리가 어려워진다.
--
-- 원문(한국어)은 holy_sites 에 그대로 두고, 이 표에는 **번역만** 쌓는다.
-- 번역이 없으면 앱은 한국어 원문으로 떨어진다(폴백). 빈 화면을 보여주는 것보다 낫다.

create table if not exists public.holy_site_translations (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.holy_sites(id) on delete cascade,

  -- BCP 47 언어 코드 (en, ja, zh-Hans …). 접수 기획서 계획대로 en 부터 채운다.
  language text not null,

  name text,
  description text,
  history text,

  -- 주소는 번역하지 않는다. 한국어 주소를 그대로 보여줘야 택시 기사에게 통한다.
  -- 대신 외국인이 읽을 수 있는 로마자 표기를 따로 둔다 (예: "Jinju-si, Gyeongsangnam-do").
  address_romanized text,

  -- AI 초벌 번역인지, 사람이 감수했는지.
  -- 종교 용어는 오역이 곧 신뢰 문제라 이 구분을 숨기지 않는다.
  translation_status text not null default 'machine'
    check (translation_status in ('machine', 'reviewed')),
  reviewed_by text,
  reviewed_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (site_id, language)
);

create index if not exists holy_site_translations_lang_idx
  on public.holy_site_translations (language);

alter table public.holy_site_translations enable row level security;

-- 번역은 누구나 읽는다. 쓰기는 service_role(관리자)만 — 정책을 두지 않으면 anon 키로 못 쓴다.
drop policy if exists "translations_public_read" on public.holy_site_translations;
create policy "translations_public_read" on public.holy_site_translations
  for select using (true);
