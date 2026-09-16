-- 관광공사 사진 「호출값」 저장 (2026-09-16)
--
-- 사진이 없는 성지 155곳 중 34곳은 한국관광공사 TourAPI(관광사진·관광정보)에 사진이 있다.
-- 공모전 규정(ADR 0002)상 응답값(이미지 주소)을 저장하면 안 되므로, 화면이 실시간으로
-- 다시 부를 수 있는 **식별자**만 둔다. 이미지 파일도 주소도 DB 에 남지 않는다.
--
--   photokorea : 관광사진 API — galContentId. 화면은 gallerySearchList1(keyword=제목)로 같은 id 를 찾는다
--   tourinfo   : 관광정보 API — contentid.  화면은 detailCommon2(contentId)로 firstimage 를 받는다
--
-- image_url 이 있는 성지는 이 칸을 쓰지 않는다(자체 사진이 우선). 채택·해제는 `npm run photos:apply`.

alter table public.holy_sites
  add column if not exists tour_photo_source text,
  add column if not exists tour_photo_id text,
  add column if not exists tour_photo_title text;

alter table public.holy_sites
  drop constraint if exists holy_sites_tour_photo_source_check;
alter table public.holy_sites
  add constraint holy_sites_tour_photo_source_check
  check (tour_photo_source is null or tour_photo_source in ('photokorea', 'tourinfo'));

-- 셋은 함께 있거나 함께 없다 — 반쪽만 남으면 화면이 무엇을 불러야 할지 모른다
alter table public.holy_sites
  drop constraint if exists holy_sites_tour_photo_all_or_none;
alter table public.holy_sites
  add constraint holy_sites_tour_photo_all_or_none
  check (
    (tour_photo_source is null and tour_photo_id is null and tour_photo_title is null)
    or (tour_photo_source is not null and tour_photo_id is not null and tour_photo_title is not null)
  );

comment on column public.holy_sites.tour_photo_source is
  '관광공사 사진 출처 API: photokorea(관광사진) | tourinfo(관광정보). 이미지 주소는 저장하지 않는다(ADR 0002)';
comment on column public.holy_sites.tour_photo_id is
  'TourAPI 식별자 — photokorea 는 galContentId, tourinfo 는 contentid. 화면이 실시간으로 조회한다';
comment on column public.holy_sites.tour_photo_title is
  'TourAPI 쪽 제목. 관광사진 API 는 id 로 직접 조회하는 오퍼레이션이 없어 제목으로 검색해 id 를 맞춘다';
