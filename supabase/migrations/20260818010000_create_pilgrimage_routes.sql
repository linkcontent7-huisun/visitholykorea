-- 순례 코스 (2026-08-18)
--
-- Gronze(산티아고 순례 가이드)의 "구간" 구조를 참고하되, 우리 노선의 축은 지리가 아니라
-- 이야기다 — 박해 사건과 인물로 성지를 순서대로 꿴다. 성지 데이터는 holy_sites 를
-- 그대로 참조하므로 새 콘텐츠 수집 없이 기존 208곳을 재사용한다.
--
-- 시드 3개 코스의 경로 근거:
--   내포길: 대전교구 공식 성지안내의 "근접 도보순례 가능 성지" 묶음 그대로
--   황석두길: 연풍성지·신리성지·갈매못성지 공식 안내의 생애 서술 (고향→거주→자수→순교→가매장)
--   김대건길: 솔뫼·해미·강경·수리치골 공식 안내의 생애 서술 (충청 구간만)

create table if not exists public.pilgrimage_routes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  description text,
  -- 목록 정렬용. 낮을수록 먼저 보인다.
  sort_order int not null default 100,
  created_at timestamptz default now()
);

create table if not exists public.pilgrimage_route_sites (
  route_id uuid not null references public.pilgrimage_routes (id) on delete cascade,
  site_id uuid not null references public.holy_sites (id) on delete cascade,
  position int not null,
  -- 이 코스에서 이 성지가 갖는 의미 한 줄 (예: "황석두의 고향이자 묘소")
  note text,
  primary key (route_id, position)
);

alter table public.pilgrimage_routes enable row level security;
alter table public.pilgrimage_route_sites enable row level security;

drop policy if exists "pilgrimage_routes_public_read" on public.pilgrimage_routes;
create policy "pilgrimage_routes_public_read" on public.pilgrimage_routes
  for select using (true);

drop policy if exists "pilgrimage_route_sites_public_read" on public.pilgrimage_route_sites;
create policy "pilgrimage_route_sites_public_read" on public.pilgrimage_route_sites
  for select using (true);

-- ── 시드 ─────────────────────────────────────────────────

insert into public.pilgrimage_routes (slug, title, subtitle, description, sort_order) values
  ('naepo-walk', '내포, 신앙의 못자리 길',
   '여사울에서 공세리까지 — 한국 교회가 자라난 들녘',
   '충청도 서북부 내포는 한국 천주교가 뿌리내린 땅이다. 1784년 세례를 받고 돌아온 이존창의 고향 여사울에서 시작해, 김대건 신부가 태어난 솔뫼, 조선 제5대 교구청이 있던 신리, 재건의 상징 합덕과 공세리까지 — 대전교구가 도보 순례 가능 구간으로 안내하는 성지들을 잇는다.', 10),
  ('hwang-seokdu', '황석두 루카의 길',
   '연풍에서 갈매못까지 — 한 회장의 생애를 따라 걷는다',
   '작두날 앞에서도 신앙을 버리지 않은 황석두 루카 성인의 생애를 순서대로 걷는다. 고향 연풍에서 시작해 여섯 해를 살던 산막골, 다블뤼 주교를 따라 스스로 잡히러 간 신리, 성금요일에 순교한 갈매못 바닷가, 그리고 양자와 조카가 시신을 모신 삽티까지.', 20),
  ('kim-daegeon', '김대건 신부의 길 (충청 구간)',
   '솔뫼에서 수리치골까지 — 첫 사제의 탄생과 귀국',
   '한국의 첫 사제 김대건 안드레아의 충청 여정이다. 태어난 솔뫼, 증조할아버지 김진후가 순교한 해미, 사제가 되어 돌아와 첫 미사를 봉헌한 강경, 그리고 그가 체포된 뒤 페레올 주교와 다블뤼 신부가 피신해 성모성심회를 세운 수리치골로 이어진다.', 30)
on conflict (slug) do nothing;

-- 코스별 경유지: holy_sites 를 이름으로 찾아 연결한다.
-- 이름이 바뀌어 못 찾으면 그 행만 조용히 빠지므로, 적용 후 반드시 개수를 검증할 것.
insert into public.pilgrimage_route_sites (route_id, site_id, position, note)
select r.id, s.id, v.position, v.note
  from (values
    ('naepo-walk', '여사울성지',       1, '내포의 사도 이존창의 고향 — 신앙의 못자리'),
    ('naepo-walk', '솔뫼성지',         2, '김대건 신부 탄생지, 4대 순교자 집안'),
    ('naepo-walk', '합덕 성당',        3, '충청도 첫 본당 — 재건의 중심'),
    ('naepo-walk', '신리성지',         4, '다블뤼 주교의 조선 제5대 교구청'),
    ('naepo-walk', '황무실 성지',      5, '끝내 회복되지 못한 교우촌 터'),
    ('naepo-walk', '공세리성지성당',   6, '옛 공세창 터에 세운 충청도 첫 본당'),
    ('hwang-seokdu', '연풍 순교성지',      1, '고향 — 작두날 앞의 회심, 지금은 묘소'),
    ('hwang-seokdu', '산막골·작은재 성지', 2, '가족과 여섯 해를 산 교우촌'),
    ('hwang-seokdu', '신리성지',           3, '"나도 함께 증거하겠다" — 자수한 자리'),
    ('hwang-seokdu', '갈매못 순교성지',    4, '1866년 성금요일, 다섯 순교자의 바닷가'),
    ('hwang-seokdu', '삽티 성지',          5, '양자 황천일과 조카 황기원이 시신을 모신 곳'),
    ('kim-daegeon', '솔뫼성지',           1, '1821년 탄생 — 소나무 숲의 생가'),
    ('kim-daegeon', '해미순교성지',       2, '증조할아버지 김진후 비오의 순교지'),
    ('kim-daegeon', '강경 성당',          3, '1845년 귀국 첫 미사를 봉헌한 포구'),
    ('kim-daegeon', '수리치골 성모 성지', 4, '체포 후 두 선교사가 피신해 성모성심회를 세운 곳')
  ) as v(slug, site_name, position, note)
  join public.pilgrimage_routes r on r.slug = v.slug
  join public.holy_sites s on s.name = v.site_name
on conflict (route_id, position) do nothing;
