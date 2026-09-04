/** 실사용 지표 실측 — 사업계획서에 넣을 숫자를 재기 위한 일회성 조회 */
import { loadEnvLocal } from './lib/env.ts';
import { connectAdminDb } from './lib/db.ts';

loadEnvLocal();

/**
 * 검수용 계정은 실사용이 아니다.
 *
 * 2026-09-04 에 `@visitholykorea.test` 테스트 계정 하나가 "가입자 2명" 으로
 * 잡혀 있었다. 이 숫자는 사업계획서와 발표자료에 그대로 들어가므로,
 * 테스트 계정이 섞이면 없는 사용자를 있다고 말하게 된다. 여기서 걸러낸다.
 */
const REAL_USER = `email not like '%@visitholykorea.test'`;

const QUERIES: Array<[string, string]> = [
  ['가입자(실사용)', `select count(*)::int as n from auth.users where ${REAL_USER}`],
  ['최근 30일 가입', `select count(*)::int as n from auth.users where ${REAL_USER} and created_at > now() - interval '30 days'`],
  ['└ 검수용 테스트 계정', `select count(*)::int as n from auth.users where not (${REAL_USER})`],
  ['프로필', `select count(*)::int as n from profiles`],
  ['스탬프(방문 인증)', `select count(*)::int as n from pilgrimage_stamps`],
  ['스탬프 남긴 사람', `select count(distinct user_id)::int as n from pilgrimage_stamps`],
  ['한 줄 기록', `select count(*)::int as n from pilgrimage_stamps where note is not null and note <> ''`],
  ['여행기', `select count(*)::int as n from pilgrimage_logs`],
  ['즐겨찾기', `select count(*)::int as n from favorites`],
  ['나침반 응답', `select count(*)::int as n from compass_responses`],
];

const main = async () => {
  const db = await connectAdminDb();
  console.log('\n=== 실사용 지표 (' + new Date().toISOString().slice(0, 10) + ') ===\n');
  for (const [label, sql] of QUERIES) {
    try {
      const r = await db.query(sql);
      console.log(label.padEnd(20), String(r.rows[0].n).padStart(6));
    } catch (e) {
      console.log(label.padEnd(20), '  조회실패:', e instanceof Error ? e.message.split('\n')[0] : e);
    }
  }
  await db.end();
};

main();
