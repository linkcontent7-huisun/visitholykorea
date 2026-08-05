-- 쉼자리(rest spots) — "지금 지쳤다면 갈 수 있는 조용한 자리".
--
-- 핵심 발상: 안내 단위는 건물이 아니라 **자리**다.
-- 한 성당에 성당 내부·성체조배실·성모상 앞·정원이 각각 다른 조건으로 열린다.
-- 특히 본당이 쉬는 월·화에도 **야외 자리는 살아 있다** — 이 구분이 없으면 그 이틀이 빈다.
--
-- catholic_directory(CBCK 주소록 5,918건)는 "어디에 무엇이 있는가"만 안다.
-- 여기에는 "거기서 쉴 수 있는가"를 담는다. 그건 스크레이핑으로 얻을 수 없고
-- 홈페이지·SNS 사진으로 짐작한 뒤 직접 가서 확인해야 하는 정보다.
-- 그래서 **근거 등급(evidence_level)을 반드시 함께 저장한다.**

-- ---------------------------------------------------------------------------
-- 쉼자리를 품은 시설
-- ---------------------------------------------------------------------------
create table if not exists public.rest_places (
  id uuid primary key default gen_random_uuid(),

  -- 주소록에서 온 곳이면 연결한다. 주소록에 없는 곳도 직접 추가할 수 있다.
  directory_id uuid references public.catholic_directory(id) on delete set null,

  name text not null,
  -- 본당 · 공소 · 성지 · 피정의집 · 수도회 · 기타
  -- 개방 요일 패턴이 이 값에 따라 갈린다 (features/rest/lib/opening-pattern.ts)
  kind text not null default '본당',
  diocese text,
  address text,
  lat double precision,
  lng double precision,
  phone text,
  homepage_url text,

  -- 시설 전체의 확인된 휴무 요일 (0=일 … 6=토). 비어 있으면 유형별 기본 패턴을 쓴다.
  closed_weekdays smallint[],
  opens_hour smallint,
  closes_hour smallint,
  -- 개방 정보를 마지막으로 확인한 날. 오래되면 화면에서 신뢰도를 낮춘다.
  openness_checked_at date,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rest_places_diocese_idx on public.rest_places (diocese);
create index if not exists rest_places_kind_idx on public.rest_places (kind);

-- ---------------------------------------------------------------------------
-- 자리 하나하나
-- ---------------------------------------------------------------------------
create table if not exists public.rest_spots (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.rest_places(id) on delete cascade,

  -- 성당 내부 · 성체조배실 · 성모상 앞 · 정원·마당 · 십자가의 길 · 야외 제대
  kind text not null,
  -- 실내 | 야외 — 야외는 건물이 닫혀도 열려 있다
  placement text not null check (placement in ('실내', '야외')),

  -- "성모상은 성당 오른편 화단 옆에 있어요" 처럼 찾아가는 요령
  how_to_find text,
  -- 그 자리의 분위기. 앉을 곳이 있는지, 그늘이 있는지 같은 실제로 도움 되는 것들
  description text,

  -- 이 정보를 어디까지 확인했는가 —
  --   추정      : SNS·홈페이지 사진으로 짐작 (있을 것 같다)
  --   자료확인  : 성당이 공개한 자료에 명시
  --   방문확인  : 직접 가서 사진 찍고 확인
  -- 짐작을 사실처럼 보여주면 헛걸음이 우리 탓이 된다. 등급을 화면에 그대로 노출한다.
  evidence_level text not null default '추정'
    check (evidence_level in ('추정', '자료확인', '방문확인')),
  evidence_checked_at date,
  evidence_source_url text,

  -- 자리별 개방 예외 (성체조배실 24시간 개방 등). 있으면 시설 패턴보다 우선한다.
  closed_weekdays smallint[],
  opens_hour smallint,
  closes_hour smallint,

  -- 직접 찍은 사진. 야외 자리는 사진이 있어야 "여기구나" 하고 알아본다.
  photo_url text,

  -- 앉을 곳이 있는지, 그늘·지붕이 있는지 — 고령 이용자에게 중요한 정보
  has_seating boolean,
  has_shade boolean,
  -- 휠체어로 접근 가능한지
  wheelchair_accessible boolean,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rest_spots_place_idx on public.rest_spots (place_id);
create index if not exists rest_spots_evidence_idx on public.rest_spots (evidence_level);

-- ---------------------------------------------------------------------------
-- RLS — 읽기는 공개, 쓰기는 관리자(service_role)만
-- ---------------------------------------------------------------------------
alter table public.rest_places enable row level security;
alter table public.rest_spots enable row level security;

drop policy if exists "rest_places_public_read" on public.rest_places;
create policy "rest_places_public_read" on public.rest_places
  for select using (true);

drop policy if exists "rest_spots_public_read" on public.rest_spots;
create policy "rest_spots_public_read" on public.rest_spots
  for select using (true);

-- ---------------------------------------------------------------------------
-- 사용자 제보 — "가 보니 열려 있었어요"
--
-- 취재로는 5,918곳을 다 확인할 수 없다. 다녀온 사람의 한 줄이 다음 사람의 근거가 된다.
-- 다만 제보를 곧바로 사실로 승격시키지 않는다. 운영자가 확인한 뒤 rest_spots 를 갱신한다.
-- ---------------------------------------------------------------------------
create table if not exists public.rest_spot_reports (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.rest_spots(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,

  -- 그때 열려 있었는가
  was_open boolean not null,
  visited_at timestamptz not null default now(),
  -- "조용했어요", "공사 중이었어요" 같은 한 줄
  note text,

  created_at timestamptz not null default now()
);

create index if not exists rest_spot_reports_spot_idx on public.rest_spot_reports (spot_id, visited_at desc);

alter table public.rest_spot_reports enable row level security;

-- 제보는 누구나 읽을 수 있다 (다음 사람의 판단 근거이므로)
drop policy if exists "reports_public_read" on public.rest_spot_reports;
create policy "reports_public_read" on public.rest_spot_reports
  for select using (true);

-- 로그인한 사용자만 남길 수 있고, 자기 이름으로만 남긴다
drop policy if exists "reports_insert_own" on public.rest_spot_reports;
create policy "reports_insert_own" on public.rest_spot_reports
  for insert with check (auth.uid() = user_id);

drop policy if exists "reports_delete_own" on public.rest_spot_reports;
create policy "reports_delete_own" on public.rest_spot_reports
  for delete using (auth.uid() = user_id);
