/**
 * 쉼자리 **시설 층**(rest_places)을 CBCK 주소록에서 채운다.
 *
 *   npx tsx scripts/seed-rest-places.ts            # 전국
 *   npx tsx scripts/seed-rest-places.ts --near 대전 --km 45
 *
 * **자리(rest_spots)는 여기서 만들지 않는다.** 스키마 주석이 못박은 대로
 * "거기서 쉴 수 있는가"는 스크레이핑으로 얻을 수 없고, 짐작을 사실처럼 저장하면
 * 헛걸음이 우리 탓이 된다. 이 스크립트는 **주소록에 이미 있는 사실만** 옮긴다 —
 * 이름·유형·교구·주소·좌표·전화. 자리는 취재로 채운다.
 *
 * 유형(kind)이 곧 개방 요일 패턴이다(`features/rest/lib/opening-pattern.ts`).
 * 본당만 월·화 휴무를 추정하고, 공소·피정의집·수도회는 '확인필요'로 남는다.
 *
 * 사회복지기관·의료기관·교육기관은 **넣지 않는다** — 병원 성당은 환자와 가족의
 * 공간이고 요양원 기도실은 외부인이 들어갈 곳이 아니다
 * (`docs/10-product/2026-08-쉼자리-컨셉.md` 4장).
 */
import { loadEnvLocal } from './lib/env.ts';
loadEnvLocal();
import pg from 'pg';
import { regionCoords } from '../src/shared/lib/regions.ts';

/** 주소록 분류 → 쉼자리 시설 유형. 여기 없는 분류는 대상이 아니다. */
const KIND_MAP: Record<string, string> = {
  본당: '본당',
  공소: '공소',
  성지사적지: '성지',
  피정의집: '피정의집',
  '수도회(남)': '수도회',
  '수도회(여)': '수도회',
};

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const near = arg('--near');
const km = Number(arg('--km') ?? 45);

const nearCoords = regionCoords(near);
if (near && !nearCoords) {
  console.error(`--near 값이 시·도가 아닙니다: ${near}`);
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();

const where: string[] = [
  `category = any($1)`,
  `lat is not null and lng is not null`,
];
const params: unknown[] = [Object.keys(KIND_MAP)];

if (nearCoords) {
  params.push(nearCoords.lat, nearCoords.lng, km);
  where.push(
    `(6371 * acos(least(1,
       cos(radians($2)) * cos(radians(lat)) * cos(radians(lng) - radians($3))
       + sin(radians($2)) * sin(radians(lat))))) <= $4`,
  );
}

const { rows } = await client.query(
  `select id, name, category, diocese, address, lat, lng, phone
   from catholic_directory where ${where.join(' and ')} order by name`,
  params,
);

console.log(`대상 시설: ${rows.length}곳${near ? ` (${near} 반경 ${km}km)` : ' (전국)'}`);

let inserted = 0;
let skipped = 0;
for (const r of rows) {
  // 같은 주소록 항목을 두 번 넣지 않는다. 다시 돌려도 안전해야 한다.
  const { rowCount } = await client.query(
    `insert into rest_places (directory_id, name, kind, diocese, address, lat, lng, phone)
     select $1, $2, $3, $4, $5, $6, $7, $8
     where not exists (select 1 from rest_places where directory_id = $1)`,
    [r.id, r.name, KIND_MAP[r.category], r.diocese, r.address, r.lat, r.lng, r.phone],
  );
  if (rowCount) inserted++;
  else skipped++;
}

const { rows: summary } = await client.query(
  `select kind, count(*) n from rest_places group by kind order by n desc`,
);
console.log(`\n새로 넣음 ${inserted} · 이미 있어 건너뜀 ${skipped}`);
console.log('\n=== rest_places 유형별 ===');
for (const s of summary) console.log('  ' + String(s.kind).padEnd(8), s.n);

const { rows: [spots] } = await client.query(`select count(*) n from rest_spots`);
console.log(`\nrest_spots: ${spots.n}곳 — 자리는 취재로 채운다(이 스크립트는 만들지 않는다).`);

await client.end();
