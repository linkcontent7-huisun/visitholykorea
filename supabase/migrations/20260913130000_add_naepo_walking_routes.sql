-- 내포지방 [도보] 성지순례 안내 (솔뫼성지 제작 안내지, 사장님이 2026-09-13 PDF 로 전달)
--
-- 안내지의 "거리 및 예상 소요시간" 그림표(성지 사이 망)에서 책자가 예시한 갈래를 코스로 옮긴다.
-- 기존 naepo-walk(여사울→공세리, 대전교구 안내 묶음)와 겹치지 않게 솔뫼를 기점으로 한 도보 코스만 넣는다.
-- 그림표에 있으나 성지가 아닌 경유지(고덕·신평성당)는 note 로만 적는다.

insert into public.pilgrimage_routes (slug, title, subtitle, description, sort_order) values
  ('naepo-walk-solmoe-haemi', '내포 도보 순례길 ① 솔뫼에서 해미까지',
   '40.0km · 9~10시간 — 김대건 신부 탄생지에서 해미 순교지까지 걸어서',
   '솔뫼성지가 펴낸 「내포지방 도보 성지순례 안내」의 대표 갈래. 성 김대건 안드레아 신부가 태어난 솔뫼에서 출발해 합덕 성당(4.0km), 다블뤼 주교의 신리(4.0km), 배나드리(8.4km), 덕산(5.6km)을 지나 해미 순교지(18.0km)에 닿는다. 내포 들판을 이틀에 나눠 걷기 좋고, 각 구간의 거리·시간은 안내지 실측값이다.', 11),
  ('naepo-walk-solmoe-hongju', '내포 도보 순례길 ② 솔뫼에서 홍주읍성까지',
   '29.4km · 7~8시간 — 황무실·덕산을 지나 홍주로',
   '솔뫼에서 황무실 교우촌 터(6.0km)를 거쳐 고덕(6.0km)·덕산(5.4km)을 지나 홍주읍성 순교지(12.0km)에 이르는 갈래. 하루 길게 걷거나 덕산에서 하룻밤 쉬어 간다. 고덕은 성지가 아닌 경유 마을이라 코스 화면에는 덕산으로 바로 잇는다.', 12),
  ('naepo-walk-hongju-darakgol', '내포 도보 순례길 ③ 홍주읍성에서 갈매못·다락골까지',
   '55.5km · 13~15시간 — 남쪽 순교지를 잇는 2박 3일',
   '홍주읍성에서 바닷가 갈매못 순교지(30.0km)로 내려갔다가 청양 다락골 줄무덤(25.5km)으로 오르는 갈래. 병인박해 순교지 셋을 잇는 긴 길이라 2박 3일로 나눈다. 안내지의 「성지에서의 마음가짐」— 기도하는 마음으로, 나의 삶을 반성하며, 순교 성인들의 삶을 묵상하며 걷는다.', 13),
  ('naepo-walk-gongseri-yeosaul', '내포 도보 순례길 ④ 공세리에서 여사울까지',
   '31.0km · 8시간 30분 — 아산만에서 내포의 못자리로',
   '아산 공세리 성당에서 솔뫼(21.0km)까지 내려온 뒤 합덕 성당(4.0km)을 지나 내포의 사도 이존창의 고향 여사울(6.0km)에 닿는다. 신평성당을 거치면 공세리→신평 13.5km, 신평→솔뫼 9.0km 로 나눠 걸을 수 있다(신평성당은 성지 목록에 없어 경유지로만 적는다).', 14)
on conflict (slug) do nothing;

insert into public.pilgrimage_route_sites (route_id, site_id, position, note)
select r.id, s.id, v.position, v.note
  from (values
    ('naepo-walk-solmoe-haemi', '솔뫼성지', 1, '출발 — 성 김대건 신부 탄생지'),
    ('naepo-walk-solmoe-haemi', '합덕 성당', 2, '4.0km · 1시간'),
    ('naepo-walk-solmoe-haemi', '신리성지', 3, '4.0km · 1시간 — 다블뤼 주교의 교구청'),
    ('naepo-walk-solmoe-haemi', '배나드리 성지', 4, '8.4km · 2시간'),
    ('naepo-walk-solmoe-haemi', '덕산 순교 성지', 5, '5.6km · 1시간 30분'),
    ('naepo-walk-solmoe-haemi', '해미순교성지', 6, '18.0km · 5~6시간 — 도착'),
    ('naepo-walk-solmoe-hongju', '솔뫼성지', 1, '출발'),
    ('naepo-walk-solmoe-hongju', '황무실 성지', 2, '6.0km · 1시간 30분'),
    ('naepo-walk-solmoe-hongju', '덕산 순교 성지', 3, '고덕(6.0km)을 지나 5.4km · 합쳐 3시간'),
    ('naepo-walk-solmoe-hongju', '홍주 순교 성지', 4, '12.0km · 3시간 — 도착'),
    ('naepo-walk-hongju-darakgol', '홍주 순교 성지', 1, '출발'),
    ('naepo-walk-hongju-darakgol', '갈매못 순교성지', 2, '30.0km · 7~8시간 — 바닷가 순교지'),
    ('naepo-walk-hongju-darakgol', '다락골 성지', 3, '25.5km · 6~7시간 — 줄무덤, 도착'),
    ('naepo-walk-gongseri-yeosaul', '공세리성지성당', 1, '출발 — 아산만 언덕의 성당'),
    ('naepo-walk-gongseri-yeosaul', '솔뫼성지', 2, '21.0km · 5시간 (신평성당 경유 시 13.5km + 9.0km)'),
    ('naepo-walk-gongseri-yeosaul', '합덕 성당', 3, '4.0km · 1시간'),
    ('naepo-walk-gongseri-yeosaul', '여사울성지', 4, '6.0km · 1시간 30분 — 도착')
  ) as v(slug, site_name, position, note)
  join public.pilgrimage_routes r on r.slug = v.slug
  join public.holy_sites s on s.name = v.site_name
on conflict (route_id, position) do nothing;

-- 출처 기록
insert into public.site_sources (site_id, kind, title, collected_at, collected_by, note)
select s.id, 'book', '내포지방 [도보] 성지순례 안내 (솔뫼성지 제작 안내지)', date '2026-09-13', '사장님 PDF / Claude 판독', '도보 코스 거리·시간'
from (values ('솔뫼성지'),('합덕 성당'),('신리성지'),('배나드리 성지'),('덕산 순교 성지'),('해미순교성지'),('황무실 성지'),
             ('홍주 순교 성지'),('갈매못 순교성지'),('다락골 성지'),('공세리성지성당'),('여사울성지')) as v(name)
join public.holy_sites s on s.name = v.name
on conflict (site_id, kind, title) do nothing;

do $$
declare c int;
begin
  for c in select count(*) from public.pilgrimage_route_sites ps join public.pilgrimage_routes r on r.id = ps.route_id where r.slug like 'naepo-walk-%' loop
    if c <> 17 then raise exception '내포 도보 코스 경유지 수가 17 이 아니다: %', c; end if;
  end loop;
end $$;
