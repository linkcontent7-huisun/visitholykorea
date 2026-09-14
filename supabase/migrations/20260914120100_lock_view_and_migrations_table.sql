-- 뷰·마이그레이션 표의 쓰기 권한 회수 (2026-09-14, db:check-security 실측)
--
-- directory_public 은 표 하나를 그대로 비춘 뷰라 Postgres 가 「자동 갱신 가능 뷰」로 취급하고,
-- Supabase 기본 권한(default privileges)이 새 뷰에도 INSERT/UPDATE/DELETE 를 준다.
-- 뷰는 소유자(postgres) 권한으로 돌아 RLS 를 타지 않으므로, 이걸 두면 anon 이 뷰를 통해
-- 원본 catholic_directory 를 고칠 수 있다. 읽기만 남긴다.
--
-- schema_migrations 는 RLS 도 정책도 없이 anon 에게 쓰기 권한이 있었다. 앱은 이 표를 쓰지 않는다
-- (db-migrate.ts 가 postgres 직결로만 만진다). 앱 역할에서 전부 회수하고 RLS 도 켠다.

revoke insert, update, delete on public.directory_public from anon, authenticated;

revoke all on public.schema_migrations from anon, authenticated;
alter table public.schema_migrations enable row level security;
