-- 교구명 정규화.
--
-- 수집 단계에서 일부 성지의 diocese 에 "대구대교구", "대전교구" 처럼 교구 접미사가
-- 그대로 들어갔다. 앱의 교구 필터는 "대구", "대전" 같은 순수 지명으로 비교하므로,
-- 접미사가 붙은 13곳이 어느 교구를 골라도 목록에 뜨지 않았다.
--
-- 2026-08-07 에 SQL Editor 에서 손으로 고쳤는데, 그러면 DB 를 다시 만들 때
-- 같은 문제가 되살아난다. 그래서 마이그레이션으로 남긴다.
--
-- where 절이 접미사가 붙은 행만 고르므로, 이미 고쳐진 DB 에서는 아무 일도 하지 않는다.

update public.holy_sites
  set diocese = regexp_replace(diocese, '(대)?교구$', '')
  where diocese ~ '(대)?교구$';

-- 약현성당은 주교좌성당이 아니다. 서울대교구 주교좌는 명동대성당 한 곳뿐이다.
update public.holy_sites
  set category = '성당'
  where name like '약현성당%' and category <> '성당';

-- 절두산은 참수터라는 사실 때문에 '순교'로 분류돼 있었는데, 지금의 절두산은
-- 순교기념관과 한강변 산책로를 갖춘 곳이라 방문자가 실제로 얻는 정서는 '치유'에 가깝다.
update public.holy_sites
  set emotion_tag = '치유'
  where name = '절두산 순교성지' and emotion_tag is distinct from '치유';
