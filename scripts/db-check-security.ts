/**
 * 권한 점검 — profiles 의 열 단위 UPDATE 권한과 보호 트리거, 주소록의 anon 열 노출,
 * pilgrimage_stamps 의 열 단위 쓰기 권한·트리거, stamp_photos·스토리지 정책, 공개 뷰의 쓰기 권한을 출력한다.
 * 2026-09-14 팀원 보안 보고 뒤에 만든 확인용. 읽기만 한다.
 *   npm run db:check-security
 * 기대값: pilgrimage_stamps 쓰기 가능 열에 hidden·photo_featured 가 없고, 트리거 stamps_protect_admin_fields 가 있다.
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

  // --- pilgrimage_stamps (20260914130000) — 회원이 hidden·photo_featured 를 못 건드리는지 ---
  const sg = await client.query(
    `select grantee, privilege_type, string_agg(column_name, ', ' order by column_name) as cols
       from information_schema.column_privileges
      where table_schema='public' and table_name='pilgrimage_stamps' and privilege_type in ('INSERT','UPDATE')
        and grantee in ('anon','authenticated') group by grantee, privilege_type order by 1, 2`,
  );
  console.log(
    'pilgrimage_stamps INSERT/UPDATE 가능 열:',
    sg.rows.length ? sg.rows.map((r) => `${r.grantee} ${r.privilege_type}: ${r.cols}`).join(' | ') : '(없음)',
  );
  const leaked = sg.rows.filter((r) => /\b(hidden|photo_featured)\b/.test(r.cols));
  console.log('  → hidden·photo_featured 쓰기 권한:', leaked.length ? `있음 (${leaked.map((r) => r.grantee).join(', ')}) ← 마이그레이션 미적용` : '없음 (정상)');
  const stg = await client.query(
    `select tgname from pg_trigger where tgrelid='public.pilgrimage_stamps'::regclass and not tgisinternal order by 1`,
  );
  console.log('pilgrimage_stamps 트리거:', stg.rows.map((r) => r.tgname).join(', ') || '(없음)');

  // --- stamp_photos 정책 — 숨긴 스탬프의 사진이 새지 않는지 (using 식을 그대로 보여준다) ---
  const spp = await client.query(
    `select polname, polcmd, pg_get_expr(polqual, polrelid) as qual, pg_get_expr(polwithcheck, polrelid) as with_check
       from pg_policy where polrelid='public.stamp_photos'::regclass order by 1`,
  );
  console.log('stamp_photos 정책:');
  for (const r of spp.rows) {
    console.log(`  ${r.polname} [${r.polcmd}] using=${r.qual ?? '-'} with_check=${r.with_check ?? '-'}`);
  }

  // --- 스토리지 pilgrim-photos 정책 — update 에 with_check 가 있는지 ---
  const sto = await client.query(
    `select polname, polcmd, pg_get_expr(polqual, polrelid) as qual, pg_get_expr(polwithcheck, polrelid) as with_check
       from pg_policy where polrelid='storage.objects'::regclass
        and (coalesce(pg_get_expr(polqual, polrelid), '') like '%pilgrim-photos%'
          or coalesce(pg_get_expr(polwithcheck, polrelid), '') like '%pilgrim-photos%') order by 1`,
  );
  console.log('storage.objects pilgrim-photos 정책:');
  for (const r of sto.rows) {
    console.log(`  ${r.polname} [${r.polcmd}] using=${r.qual ?? '-'} with_check=${r.with_check ?? '-'}`);
  }

  // --- 공개 뷰 — 소유자 권한 뷰(security_invoker 없음)에 앱 역할의 쓰기 권한이 남아 있으면 RLS 우회 통로다 ---
  const views = await client.query(
    `select c.relname,
            coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name='security_invoker'), 'false') as invoker,
            (select string_agg(grantee || ':' || privilege_type, ', ' order by grantee, privilege_type)
               from information_schema.table_privileges t
              where t.table_schema='public' and t.table_name=c.relname
                and t.grantee in ('anon','authenticated') and t.privilege_type in ('INSERT','UPDATE','DELETE')) as dml
       from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='v' order by 1`,
  );
  console.log('public 뷰 (security_invoker / anon·authenticated DML 권한):');
  for (const r of views.rows) {
    console.log(`  ${r.relname} invoker=${r.invoker} dml=${r.dml ?? '(없음)'}`);
  }
} finally {
  await client.end();
}
