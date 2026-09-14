/**
 * 권한 점검 — profiles 의 열 단위 UPDATE 권한과 보호 트리거, 주소록의 anon 열 노출을 출력한다.
 * 2026-09-14 팀원 보안 보고 뒤에 만든 확인용. 읽기만 한다.
 *   npm run db:check-security
 */
import pg from 'pg';
import { loadEnvLocal } from './lib/env.ts';

loadEnvLocal();
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
try {
  const g = await client.query(
    `select grantee, string_agg(column_name, ', ' order by column_name) as cols
       from information_schema.column_privileges
      where table_schema='public' and table_name='profiles' and privilege_type='UPDATE'
        and grantee in ('anon','authenticated') group by grantee`,
  );
  console.log('profiles UPDATE 가능 열:', g.rows.length ? g.rows.map((r) => `${r.grantee}: ${r.cols}`).join(' | ') : '(없음)');
  const tg = await client.query(`select tgname from pg_trigger where tgrelid='public.profiles'::regclass and not tgisinternal`);
  console.log('profiles 트리거:', tg.rows.map((r) => r.tgname).join(', ') || '(없음)');
  const cd = await client.query(
    `select string_agg(column_name, ', ' order by column_name) as cols from information_schema.column_privileges
      where table_schema='public' and table_name='catholic_directory' and privilege_type='SELECT' and grantee='anon'`,
  );
  console.log('catholic_directory anon SELECT 열:', cd.rows[0]?.cols ?? '(없음)');
  const tbl = await client.query(
    `select table_name, string_agg(privilege_type, ',') as p from information_schema.table_privileges
      where table_schema='public' and grantee='anon' and privilege_type in ('INSERT','UPDATE','DELETE') group by table_name order by 1`,
  );
  const rls = await client.query(
    `select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' order by 1`,
  );
  console.log('RLS 꺼진 표:', rls.rows.filter((r) => !r.relrowsecurity).map((r) => r.relname).join(', ') || '(없음)');
  const pol = await client.query(
    `select c.relname, count(p.polname) as n from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
       left join pg_policy p on p.polrelid=c.oid where ns.nspname='public' and c.relkind='r' group by c.relname having count(p.polname)=0 order by 1`,
  );
  console.log('정책이 하나도 없는 표:', pol.rows.map((r) => r.relname).join(', ') || '(없음)');
  console.log('anon 이 INSERT/UPDATE/DELETE 권한을 가진 표:', tbl.rows.map((r) => `${r.table_name}(${r.p})`).join(', '));
} finally {
  await client.end();
}
