/**
 * 포토코리아 후보 CSV 의 `use=y` 행을 성지 대표 사진으로 넣는다 (task_IMAGE 작업 0).
 *
 * 관광공사 주소를 DB 에 그대로 두면 TourAPI 응답 저장(ADR 0002)이 되므로,
 * 파일을 내려받아 `public/images/sites/` 에 내장하고 그 경로만 DB 에 쓴다.
 *
 *   npx tsx scripts/photokorea-import.ts            파일만 내려받는다 (DB 안 씀)
 *   npx tsx scripts/photokorea-import.ts --db       내려받은 파일 경로를 DB 에 쓴다
 *
 * 관광사진(photokorea) API 사진은 공공누리 제1유형이라 700KB 를 넘으면 리사이즈해도 된다 —
 * 이 스크립트는 리사이즈하지 않고 넘는 파일을 알려만 준다 (윈도우 내장 System.Drawing 으로 손수).
 * 관광정보(tourinfo) API 사진은 1·3유형이 섞여 있어(3유형 = 변경 금지) **원본 그대로** 둔다.
 * 9/16 실측으로 32장 전부 700KB 이하라 그대로 내장할 수 있었다.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { loadEnvLocal } from './lib/env.ts';
import { connectAdminDb } from './lib/db.ts';
import { romanizeKorean } from '../src/shared/lib/korean-romanize.ts';

loadEnvLocal({ supabasePlaceholder: true });

const FILES = [
  'data/research/photokorea_candidates_2026-09-15.csv',
  'data/research/photokorea_candidates_2026-09-15_tour.csv',
];
/** 같은 성지에 두 API 후보가 다 있을 때 기본은 관광사진(고화질). 눈으로 보고 관광정보 쪽이 나은 곳만 여기 적는다 (9/16). */
const PREFER_TOURINFO = new Set(['은이 성지', '한티 순교성지']);
const MAX_BYTES = 700 * 1024;

type Row = Record<string, string>;
function parseCsv(path: string): Row[] {
  const raw = readFileSync(path, 'utf-8').replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let cur: string[] = [], field = '', quoted = false;
  for (let i = 0; i < raw.length; i += 1) {
    const c = raw[i];
    if (quoted) {
      if (c === '"') { if (raw[i + 1] === '"') { field += '"'; i += 1; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { cur.push(field); field = ''; }
    else if (c === '\n') { cur.push(field.replace(/\r$/, '')); rows.push(cur); cur = []; field = ''; }
    else field += c;
  }
  if (field || cur.length) { cur.push(field); rows.push(cur); }
  const [header = [], ...body] = rows;
  return body.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((k, i) => [k, r[i] ?? ''])));
}

const rows: Row[] = FILES.flatMap(parseCsv).filter((r) => r.use === 'y').map((r) => ({ ...r, source: r.source || 'photokorea' }));
const bySite = new Map<string, Row>();
for (const r of rows) {
  const id = r.site_id ?? '';
  const prev = bySite.get(id);
  const preferThis = !prev || (PREFER_TOURINFO.has(r.site_name ?? '') ? r.source === 'tourinfo' : r.source === 'photokorea');
  if (preferThis) bySite.set(id, r);
}

const writeDb = process.argv.includes('--db');
const db = writeDb ? await connectAdminDb() : null;
let over = 0;
for (const [siteId, r] of bySite) {
  const name = r.site_name ?? '';
  const source = r.source ?? 'photokorea';
  const slug = romanizeKorean(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const file = `public/images/sites/${slug}.jpg`;
  if (!existsSync(file)) writeFileSync(file, Buffer.from(await (await fetch(r.gal_image_url ?? '')).arrayBuffer()));
  const size = statSync(file).size;
  const tooBig = size > MAX_BYTES;
  if (tooBig) over += 1;
  console.log(`${tooBig ? '⚠ 700KB 초과' : '  '} ${(size / 1024).toFixed(0).padStart(4)}KB ${source.padEnd(10)} ${name} → ${file}`);
  if (db && !tooBig) {
    const isPk = source === 'photokorea';
    await db.query(
      `update holy_sites set image_url = $2, image_source = $3, image_license = $4 where id = $1 and image_url is null`,
      [
        siteId,
        `/images/sites/${slug}.jpg`,
        isPk ? `한국관광공사 포토코리아 (촬영 ${r.gal_photographer ?? ''})` : `한국관광공사 TourAPI 관광정보 (contentId ${r.gal_content_id ?? ''})`,
        isPk ? '공공누리 제1유형' : '공공누리 (제1·3유형 미확인 · 원본 무변경)',
      ],
    );
  }
}
console.log(`\n성지 ${bySite.size}곳 · 700KB 초과 ${over}장${writeDb ? ' · DB 반영(초과분 제외)' : ' · DB 안 씀 (--db 로 반영)'}`);
if (db) await db.end();
