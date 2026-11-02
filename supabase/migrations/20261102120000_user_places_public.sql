-- 공개된 순례자 장소를 성지 상세 화면에 보여 주기 위한 뷰 (2026-11-02 사장님 지시).
--
-- · 관리자가 「공개」한(approved) 것만 — 뷰 안에서 직접 거른다(뷰는 소유자 권한으로 돌아 RLS 를 타지 않는다).
-- · 쓴 사람(user_id)은 내보내지 않는다 — 사장님 결정 「사진·이름·감정·한 줄, 쓴 사람 이름은 빼고」.
-- · 주소록에서 고른 장소는 그 좌표(lat·lng)를 붙여, 성지에서 가까운지 잴 수 있게 한다.

create or replace view public.user_places_public as
select
  p.id,
  p.name,
  p.address,
  p.description,
  p.photo_url,
  p.emotion,
  p.emotion_note,
  p.visited_on,
  d.lat,
  d.lng
from public.user_places p
left join public.catholic_directory d on d.id = p.directory_id
where p.status = 'approved';

-- 읽기만. (자동 갱신 가능 뷰라 기본 권한이 쓰기까지 준다 — 2026-09-14 directory_public 과 같은 이유)
revoke all on public.user_places_public from anon, authenticated;
grant select on public.user_places_public to anon, authenticated;
