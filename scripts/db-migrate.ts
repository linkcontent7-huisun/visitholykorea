/**
 * 마이그레이션 적용기.
 *
 *   npm run db:status     — 무엇이 적용됐고 무엇이 남았는지
 *   npm run db:migrate    — 남은 것을 순서대로 적용
 *
 * **왜 만들었나** — 2026-08-07 에 마이그레이션 3개(`pilgrimage_logs`,
 * `rest_spots`, `holy_site_translations`)가 파일로만 존재하고 DB 에는
 * 적용된 적이 없다는 걸 발견했다. 아무도 몰랐던 이유는 적용 여부를
 * 기록하는 곳이 없었기 때문이다. 그래서 적용 이력을 DB 안에 남긴다.
 *
 * Supabase 의 anon/service_role 키는 PostgREST 용이라 DDL 을 못 돌린다.
 * 테이블을 만들려면 Postgres 에 직접 붙어야 하므로 접속 문자열이 필요하다.
 *
 *   .env.local 에 SUPABASE_DB_URL 을 넣는다.
 *   Supabase 대시보드 → Connect → Session pooler 의 URI 를 쓴다.
 *
 * 접속 문자열에는 DB 비밀번호가 들어 있다. `.env.local` 은 git 에 올라가지
 * 않으니 거기까지만 두고, 절대 코드나 문서에 적지 않는다.
 *
 * **이력이 비어 있으면 전부 대기로 잡힌다.** 이미 적용된 것까지 다시 돌리게 되는데,
 * 지금의 마이그레이션은 전부 `create ... if not exists` 와 `drop policy if exists`
 * 뿐이라 다시 돌려도 아무 일도 일어나지 않는다. 앞으로 추가할 마이그레이션도
 * 이 성질을 지켜야 한다 — 그래야 이 러너를 믿고 돌릴 수 있다.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import pg from 'pg';
import { loadEnvLocal, ROOT } from './lib/env.ts';

loadEnvLocal({ supabasePlaceholder: true });

const statusOnly = process.argv.includes('--status');

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error(
    '\nSUPABASE_DB_URL 이 없습니다.\n\n' +
      '  Supabase 대시보드 → 상단 Connect 버튼 → Session pooler 의 URI 를 복사해\n' +
      '  .env.local 에 아래 형태로 넣으세요.\n\n' +
      '  SUPABASE_DB_URL=postgresql://postgres.<ref>:<비밀번호>@<host>:5432/postgres\n\n' +
      '  비밀번호를 모르면 Settings → Database → Reset database password 로 새로 만들 수 있습니다.\n',
  );
  process.exit(1);
}

const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

interface Migration {
  name: string;
  sql: string;
  checksum: string;
}

const migrations: Migration[] = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((name) => {
    const sql = readFileSync(join(MIGRATIONS_DIR, name), 'utf-8');
    return { name, sql, checksum: createHash('sha256').update(sql).digest('hex').slice(0, 12) };
  });

const client = new pg.Client({ connectionString });

try {
  await client.connect();
} catch (e) {
  console.error('DB 접속 실패:', e instanceof Error ? e.message : e);
  console.error('SUPABASE_DB_URL 의 호스트·비밀번호를 확인하세요.');
  process.exit(1);
}

try {
  // 이력 표부터 만든다. 이 표가 없어서 이번 사고가 났다.
  await client.query(`
    create table if not exists public.schema_migrations (
      name text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);

  const { rows } = await client.query<{ name: string; checksum: string }>(
    'select name, checksum from public.schema_migrations',
  );
  const applied = new Map(rows.map((r) => [r.name, r.checksum] as const));

  const pending = migrations.filter((m) => !applied.has(m.name));

  console.log(`\n마이그레이션 — 전체 ${migrations.length}개\n`);
  for (const m of migrations) {
    const prev = applied.get(m.name);
    if (prev === undefined) console.log(`  대기   ${m.name}`);
    else if (prev !== m.checksum) console.log(`  변경됨 ${m.name}  (적용 후 파일이 수정됨)`);
    else console.log(`  적용됨 ${m.name}`);
  }

  if (pending.length === 0) {
    console.log('\n남은 마이그레이션이 없습니다.\n');
  } else if (statusOnly) {
    console.log(`\n대기 ${pending.length}개. 적용하려면 npm run db:migrate\n`);
  } else {
    console.log(`\n${pending.length}개를 적용합니다...\n`);

    for (const m of pending) {
      // 한 파일이 통째로 성공하거나 통째로 실패해야 한다. 절반만 적용되면
      // 다음 실행 때 무엇이 남았는지 알 수 없게 된다.
      try {
        await client.query('begin');
        await client.query(m.sql);
        await client.query(
          'insert into public.schema_migrations (name, checksum) values ($1, $2)',
          [m.name, m.checksum],
        );
        await client.query('commit');
        console.log(`  적용   ${m.name}`);
      } catch (e) {
        await client.query('rollback');
        console.error(`\n  실패   ${m.name}`);
        console.error(`  ${e instanceof Error ? e.message : e}\n`);
        process.exit(1);
      }
    }

    // 테이블을 만들어도 PostgREST 가 스키마 캐시를 갱신하기 전까지는 못 본다.
    await client.query(`notify pgrst, 'reload schema'`);
    console.log('\n완료. PostgREST 스키마 캐시도 갱신했습니다.\n');
  }
} finally {
  await client.end();
}
