/**
 * 순례자 사진을 성지 대표 사진으로 승격/해제한다 (로컬 전용).
 *
 * 성지 대표 사진은 그 성지의 얼굴이라 자동 승격을 하지 않는다. 운영자가
 * 눈으로 보고 승인한 사진만 대표가 된다.
 *
 *   npm run photo:pending           대기 중인 순례자 사진 목록 (사진 없는 성지 우선)
 *   npm run photo:feature -- <id>   그 스탬프의 사진을 대표로 승격
 *   npm run photo:unfeature -- <id> 승격 해제
 *
 * service_role JWT 가 아니라 SUPABASE_DB_URL 직결을 쓴다 — 2026-08-26 의
 * 키 사고 때도 이 경로는 멀쩡히 돌았다(`scripts/lib/db.ts` 주석 참고).
 */

import { connectAdminDb } from './lib/db';
import { loadEnvLocal } from './lib/env.ts';

// `.env.local` 을 먼저 올린다 — 이게 없으면 SUPABASE_DB_URL 을 못 찾아
// "SUPABASE_DB_URL 이 없습니다"만 찍고 끝난다(2026-09-06 발견).
loadEnvLocal({ supabasePlaceholder: true });

type Mode = 'pending' | 'feature' | 'unfeature';

async function main() {
  const [modeArg, stampId] = process.argv.slice(2);
  const mode = (modeArg ?? 'pending') as Mode;

  if (!['pending', 'feature', 'unfeature'].includes(mode)) {
    console.error(`알 수 없는 명령입니다: ${modeArg}`);
    process.exit(1);
  }
  if ((mode === 'feature' || mode === 'unfeature') && !stampId) {
    console.error(`스탬프 id 가 필요합니다.  예) npm run photo:${mode} -- <stamp-id>`);
    process.exit(1);
  }

  const db = await connectAdminDb();
  try {
    if (mode === 'pending') {
      // 사진이 없는 성지의 사진부터 보여준다 — 그게 지금 가장 급한 자리다.
      const { rows } = await db.query(`
        select s.id, s.site_id, h.name as site_name, s.photo_url, s.created_at,
               (h.image_url is null) as site_needs_photo
        from pilgrimage_stamps s
        join holy_sites h on h.id = s.site_id
        where s.photo_url is not null
          and s.photo_featured = false
          and s.hidden = false
        order by site_needs_photo desc, s.created_at desc
        limit 50
      `);

      if (rows.length === 0) {
        console.log('대기 중인 순례자 사진이 없습니다.');
        return;
      }

      console.log(`\n대기 중인 순례자 사진 ${rows.length}건 (사진 없는 성지 우선)\n`);
      for (const r of rows) {
        const mark = r.site_needs_photo ? '🔴 사진 없는 성지' : '   공식 사진 있음';
        console.log(`${mark}  ${r.site_name}`);
        console.log(`   stamp: ${r.id}`);
        console.log(`   photo: ${r.photo_url}\n`);
      }
      console.log('승격:  npm run photo:feature -- <stamp-id>\n');
      return;
    }

    const featured = mode === 'feature';
    const { rows } = await db.query(
      `update pilgrimage_stamps s
         set photo_featured = $2
       from holy_sites h
       where s.id = $1 and h.id = s.site_id and s.photo_url is not null
       returning h.name as site_name, s.photo_url`,
      [stampId, featured],
    );

    if (rows.length === 0) {
      console.error('해당 스탬프를 찾지 못했거나 사진이 없습니다: ' + stampId);
      process.exit(1);
    }

    const row = rows[0];
    console.log(
      featured
        ? `✅ ${row.site_name} 대표 사진으로 승격했습니다.\n   ${row.photo_url}`
        : `↩️  ${row.site_name} 대표 사진 승격을 해제했습니다.`,
    );
  } finally {
    await db.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
