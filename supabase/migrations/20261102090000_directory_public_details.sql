-- 주소록 공개 뷰에 설명·미사 시간·주보성인·설립일·홈페이지를 더한다 (2026-11-02).
--
-- 제주교구 본당 31곳의 설명·미사 시간을 교구 홈페이지에서 모아 넣었는데(2026-11-02),
-- 앱이 읽는 directory_public 은 이름·주소·전화·좌표만 비춰 이용자에게 하나도 안 보였다.
-- 모두 성당이 스스로 공개한 안내 정보라 공개 뷰에 둬도 된다(연락처·담당자 개인 정보는 여전히 뺀다).
--
-- 열은 맨 뒤에만 덧붙인다(create or replace view 규칙). 같은 뷰 객체라
-- 2026-09-14 에 회수한 쓰기 권한(insert/update/delete)은 그대로 회수된 채로 남는다.

create or replace view public.directory_public as
select
  id,
  name,
  name_compact,
  category,
  diocese,
  phone,
  address,
  lat,
  lng,
  name_romanized,
  address_romanized,
  description,
  mass_times,
  patron,
  founded_on,
  homepage
from public.catholic_directory
where category = any (array['본당'::text, '공소'::text, '피정의집'::text]);

revoke insert, update, delete on public.directory_public from anon, authenticated;
