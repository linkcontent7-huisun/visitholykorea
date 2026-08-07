/**
 * 붐빔 지수 실측 리포트.
 *
 * 산식이 그럴듯한 숫자가 아니라 실제와 맞는지 확인하려고 만든 도구다.
 * 실제 TourAPI를 호출해 성지별 오늘의 붐빔 지수를 표로 찍는다.
 *
 *   npm run crowding
 *
 * `.env.local` 의 VITE_TOUR_API_SERVICE_KEY 가 있어야 동작한다.
 * 좌표는 data/reference/holy_sites_daejeon.csv 에서 읽는다 (좌표가 확보된 성지들).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';

// 이 스크립트는 Supabase 를 쓰지 않지만 env 모듈이 URL·anon 키를 필수로 요구한다.
loadEnvLocal({ supabasePlaceholder: true });

// env 를 채운 뒤에 불러와야 한다.
const { getNearbyByLocation, getOngoingFestivals } = await import('../src/shared/api/tour-api.ts');
const { combineCrowdingScore, festivalPressure, infraDensity, RADIUS_KM } =
  await import('../src/features/quiet/api/crowding-score.ts');

// ---------------------------------------------------------------------------
// 대상 성지 — 좌표가 확보된 곳
// ---------------------------------------------------------------------------
interface Target {
  name: string;
  lat: number;
  lng: number;
}

/** 충청권 성지 (대부분 농촌·산간) */
function loadFromCsv(): Target[] {
  const csv = readFileSync(join(ROOT, 'data/reference/holy_sites_daejeon.csv'), 'utf-8');
  const [header, ...rows] = csv.trim().split('\n');
  if (!header) return [];

  const columns = header.split(',');
  const nameIdx = columns.indexOf('name');
  const latIdx = columns.indexOf('latitude');
  const lngIdx = columns.indexOf('longitude');

  const targets: Target[] = [];
  for (const row of rows) {
    // 따옴표 안의 쉼표를 보존하며 분리
    const cells = row.match(/("[^"]*"|[^,]+)/g)?.map((c) => c.replace(/^"|"$/g, '')) ?? [];
    const name = cells[nameIdx];
    const lat = Number(cells[latIdx]);
    const lng = Number(cells[lngIdx]);
    if (name && Number.isFinite(lat) && Number.isFinite(lng)) {
      targets.push({ name, lat, lng });
    }
  }
  return targets;
}

/** 배치3 성지 — 도심 주교좌성당이 섞여 있어 대조군이 된다 */
function loadFromBatch3(): Target[] {
  const raw = readFileSync(
    join(ROOT, 'data/research/holy_sites_batch3_notion_import.json'),
    'utf-8',
  );
  const rows = JSON.parse(raw) as { name?: string; lat?: number; lng?: number }[];
  return rows
    .filter((r) => r.name && Number.isFinite(r.lat) && Number.isFinite(r.lng))
    .map((r) => ({ name: r.name!, lat: r.lat!, lng: r.lng! }));
}

function loadTargets(): Target[] {
  return [...loadFromCsv(), ...loadFromBatch3()];
}

// ---------------------------------------------------------------------------
// 실행
// ---------------------------------------------------------------------------
const targets = loadTargets();
if (targets.length === 0) {
  console.error('좌표가 있는 성지를 찾지 못했습니다.');
  process.exit(1);
}

console.log(`\n오늘의 붐빔 지수 — 대상 ${targets.length}곳`);
console.log(`측정 시각: ${new Date().toLocaleString('ko-KR')}\n`);

console.log('[1단계] 전국 축제·행사 조회 (호출 1회)');
const festivals = await getOngoingFestivals();
console.log(`  오늘 진행 중인 행사 ${festivals.length}건\n`);

console.log(`[2단계] 성지별 주변 인프라 조회 (호출 ${targets.length}회)`);

interface Row {
  name: string;
  score: number;
  level: string;
  festival: number;
  attraction: number;
  stay: number;
  reasons: string[];
}

const results: Row[] = [];
for (const target of targets) {
  const coords = { lat: target.lat, lng: target.lng };
  const spots = await getNearbyByLocation(target.lng, target.lat, {
    radiusMeters: RADIUS_KM.infra * 1000,
    numOfRows: 50,
    contentTypeId: null,
  }).catch(() => []);

  const crowding = combineCrowdingScore(festivalPressure(coords, festivals), infraDensity(spots));

  results.push({
    name: target.name,
    score: crowding.score,
    level: crowding.level,
    festival: crowding.breakdown.festival,
    attraction: crowding.breakdown.attraction,
    stay: crowding.breakdown.stay,
    reasons: crowding.reasons,
  });
  process.stdout.write('.');
}
console.log('\n');

results.sort((a, b) => a.score - b.score);

const pad = (text: string, width: number) => {
  // 한글은 폭이 2이므로 실제 표시 폭으로 맞춘다
  const visual = [...text].reduce((sum, ch) => sum + (ch.charCodeAt(0) > 0x2e80 ? 2 : 1), 0);
  return text + ' '.repeat(Math.max(0, width - visual));
};

console.log(`${pad('성지', 24)}${pad('지수', 8)}${pad('등급', 12)}축제 / 명소 / 체류`);
console.log('-'.repeat(70));
for (const row of results) {
  console.log(
    `${pad(row.name, 24)}${pad(String(row.score), 8)}${pad(row.level, 12)}` +
      `${row.festival} / ${row.attraction} / ${row.stay}`,
  );
}

console.log('\n가장 조용한 곳의 근거:');
const quietest = results[0];
if (quietest) {
  console.log(`  ${quietest.name}`);
  for (const reason of quietest.reasons) console.log(`   · ${reason}`);
}

console.log(`\n총 API 호출: ${1 + targets.length}회`);
console.log('(성지마다 유형별로 따로 물었다면 ' + targets.length * 3 + '회 이상이었다)\n');
