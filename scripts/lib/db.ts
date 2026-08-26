/**
 * 스크립트 전용 DB 직결.
 *
 * `admin.ts` 의 service_role 클라이언트와 하는 일은 같다 — RLS 를 우회해서
 * 관리자 권한으로 읽고 쓴다. 다른 점은 **붙는 방법**이다.
 *
 * service_role 은 JWT 라서 토큰이 상하면 통째로 막힌다. 2026-08-26 에 실제로
 * 그랬다 — 키가 `JWT issued at future` 로 거부되면서 번역 import 가 한 건도
 * 안 들어갔다. 노트북 시계도 정상이었고 앱이 쓰는 anon 키도 멀쩡했는데,
 * 그 키 하나 때문에 194곳 중 122곳이 발이 묶였다.
 *
 * `SUPABASE_DB_URL` 로 붙는 이 경로는 JWT 를 거치지 않는다. 마이그레이션
 * (`db-migrate.ts`)이 이미 이 방식으로 도는데, 같은 사고 때도 멀쩡히 돌았다.
 * 로컬에서만 쓰는 관리자 스크립트라면 토큰 만료·시계 문제에 흔들릴 이유가 없다.
 *
 * **앱 코드에서는 절대 import 하지 않는다.** 브라우저에는 DB 비밀번호가
 * 있어서도 안 되고, 있을 수도 없다.
 */

import pg from 'pg';

/** 붙어 있는 클라이언트를 준다. 다 쓰면 `client.end()` 를 부른다. */
export async function connectAdminDb(): Promise<pg.Client> {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    console.error(
      '\nSUPABASE_DB_URL 이 없습니다.\n\n' +
        '  Supabase 대시보드 → 상단 Connect 버튼 → Session pooler 의 URI 를 복사해\n' +
        '  .env.local 에 아래 형태로 넣으세요.\n\n' +
        '  SUPABASE_DB_URL=postgresql://postgres.<ref>:<비밀번호>@<host>:5432/postgres\n',
    );
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
  } catch (e) {
    console.error('DB 접속 실패:', e instanceof Error ? e.message : e);
    console.error('SUPABASE_DB_URL 의 호스트·비밀번호를 확인하세요.');
    process.exit(1);
  }

  return client;
}
