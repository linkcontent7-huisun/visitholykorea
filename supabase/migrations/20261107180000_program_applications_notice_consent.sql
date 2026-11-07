-- 체험여행 접수: 「다음 관련 행사 안내 받기」 선택 동의 칸 (2026-11-07 사장님 지시)
--
-- 필수 동의(privacy_consent) = 접수 처리 + 주최 기관에 명단 전달.
-- 선택 동의(notice_consent) = 이름·연락처를 1년 보관하고 다음 관련 행사를 안내. 체크 안 해도 접수된다.
-- 기존 접수 줄은 모두 false(안내 동의 안 함)로 채워진다.

alter table public.program_applications
  add column if not exists notice_consent boolean not null default false;
