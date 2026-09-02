-- 순례자 사진을 성지 대표 사진으로 승격하는 길 (공모전 기능개선 기획안 개선 1).
--
-- 208곳 중 157곳에 사진이 없다. 자동 수집 4경로는 2026-08-28 에 소진했고
-- 남은 길은 현장 촬영뿐인데, 촬영으로 157곳을 메우는 데는 시간과 돈이 든다.
-- 그런데 우리에겐 이미 **실방문자가 올린 사진**이 있다(순례자 이야기, 9/1).
-- 그 사진이 이야기 카드 안에만 갇혀 있고, 정작 비어 있는 대표 사진 자리는
-- 회색 그대로다. 그 둘을 잇는다.
--
-- **자동 승격은 하지 않는다.** 성지 대표 사진은 그 성지의 얼굴이라, 아무
-- 사진이나 올라오는 순간 대표가 되면 성지의 격이 떨어진다. 운영자가 승인한
-- 사진만 대표가 된다(`scripts/feature-photo.ts`).
--
-- 이 파일도 다른 마이그레이션처럼 여러 번 돌려도 안전해야 한다(러너 규칙).

-- 1) 승인 플래그. 기본은 false — 올린다고 대표가 되지 않는다.
alter table public.pilgrimage_stamps
  add column if not exists photo_featured boolean not null default false;

-- 대표 사진 조회가 잦으므로(성지 목록·상세 전부) 부분 인덱스를 둔다.
create index if not exists pilgrimage_stamps_featured_idx
  on public.pilgrimage_stamps (site_id, created_at desc)
  where photo_featured = true and hidden = false;

-- 2) 성지별 대표 사진 한 장. 승인·미숨김·사진 있음만, 성지당 최신 1장.
--    뷰로 두는 이유: 앱은 "이 성지의 대표 사진"만 알면 되고, 그 뒤의
--    스탬프·사용자 정보는 알 필요가 없다(사생활 최소 노출).
create or replace view public.site_featured_photos as
  select distinct on (site_id)
    site_id,
    photo_url,
    created_at
  from public.pilgrimage_stamps
  where photo_featured = true
    and hidden = false
    and photo_url is not null
  order by site_id, created_at desc;

grant select on public.site_featured_photos to anon, authenticated;
