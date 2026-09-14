-- 여행기(pilgrimage_logs)에 사진 여러 장을 붙인다 (2026-09-14 사장님 요청 — "기록에 왜 사진이 없나").
-- 파일은 pilgrim-photos 버킷의 본인 uid 폴더(<uid>/logs/<log_id>/<n>.jpg)에 들어가고,
-- 여기에는 공개 URL 목록만 순서대로 남긴다. 스탬프 사진(stamp_photos)과 달리 여행기는
-- 본인만 보는 기록이라 별도 표·공개 뷰를 만들지 않는다.
alter table public.pilgrimage_logs
  add column if not exists photos text[] not null default '{}'::text[];
