/**
 * 채택한 관광공사 사진의 「호출값」을 holy_sites 에 적는다 (로컬 전용).
 *
 *   npm run photos:apply                    data/research/tour_photo_refs.csv 를 DB 에 반영
 *   npm run photos:apply -- --dry-run       무엇이 바뀔지만 보여준다
 *   npm run photos:apply -- --clear <id>    그 성지의 호출값을 지운다
 *
 * CSV 열: site_id, source(photokorea|tourinfo), content_id, title, note
 *   - photokorea 의 content_id 는 TourAPI 관광사진 API 의 galContentId 다.
 *     콘텐츠랩 사이트 식별자(예: 7ntH1a)가 아니다 — 그건 앱이 다시 부를 수 없다.
 *   - tourinfo 의 content_id 는 관광정보 contentid.
 *   - note 는 사람이 사진을 열어 보고 적은 한 줄("입구 간판", "성모상"). 근거를 남긴다.
 *
 * 무엇을 안 하는가 — 이미지 주소·파일은 저장하지 않는다. 화면이 `/api/tour` 로 매번 받는다(ADR 0002).
 * image_url 이 있는 성지는 건너뛴다(자체 사진이 우선). 한 성지에 두 줄이 있으면 photokorea 를 택한다
 * (고품질 관광사진이 관광정보 대표 사진보다 낫다 — 9/15 육안 비교).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';
import { connectAdminDb } from './lib/db.ts';

loadEnvLocal({ supabasePlaceholder: true });

const dryRun = process.argv.includes('--dry-run');
const clearIndex = process.argv.indexOf('--clear');

interface RefRow {
  site_id: string;
  source: 'photokorea' | 'tourinfo';
  content_id: string;
  title: string;
  note: string;
}

/** 따옴표·쉼표가 든 칸을 다루는 최소 CSV 파서 (Excel 저장 형식) */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const [header = [], ...body] = rows.filter((r) => r.some((c) => c.trim() !== ''));
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const db = await connectAdminDb();
try {
  if (clearIndex !== -1) {
    const id = process.argv[clearIndex + 1];
    if (!id) throw new Error('--clear 뒤에 성지 id 가 필요합니다');
    if (!dryRun) {
      await db.query(
        `update public.holy_sites set tour_photo_source = null, tour_photo_id = null, tour_photo_title = null where id = $1`,
        [id],
      );
    }
    console.log(`${dryRun ? '[dry-run] ' : ''}지움: ${id}`);
  } else {
    const csvPath = join(ROOT, 'data', 'research', 'tour_photo_refs.csv');
    const rows = parseCsv(readFileSync(csvPath, 'utf8')) as unknown as RefRow[];
    const bad = rows.filter(
      (r) => !r.site_id || !r.content_id || !r.title || !['photokorea', 'tourinfo'].includes(r.source),
    );
    if (bad.length) {
      console.error('형식이 틀린 줄:', bad);
      process.exit(1);
    }
    // 성지당 한 줄 — photokorea 우선
    const chosen = new Map<string, RefRow>();
    for (const r of rows) {
      const prev = chosen.get(r.site_id);
      if (!prev || (prev.source === 'tourinfo' && r.source === 'photokorea')) chosen.set(r.site_id, r);
    }

    const { rows: sites } = await db.query<{
      id: string; name: string; image_url: string | null; tour_photo_source: string | null; tour_photo_id: string | null;
    }>(`select id, name, image_url, tour_photo_source, tour_photo_id from public.holy_sites where id = any($1::uuid[])`, [
      [...chosen.keys()],
    ]);
    const byId = new Map(sites.map((s) => [s.id, s]));

    let applied = 0;
    let skipped = 0;
    for (const [id, r] of chosen) {
      const s = byId.get(id);
      if (!s) { console.log(`✗ 없는 성지 id: ${id}`); skipped += 1; continue; }
      if (s.image_url) { console.log(`· ${s.name} — 자체 사진이 있어 건너뜀`); skipped += 1; continue; }
      if (s.tour_photo_source === r.source && s.tour_photo_id === r.content_id) { skipped += 1; continue; }
      if (!dryRun) {
        await db.query(
          `update public.holy_sites set tour_photo_source = $2, tour_photo_id = $3, tour_photo_title = $4 where id = $1`,
          [id, r.source, r.content_id, r.title],
        );
      }
      console.log(`${dryRun ? '[dry-run] ' : '○ '}${s.name} ← ${r.source} ${r.content_id} 「${r.title}」${r.note ? ` (${r.note})` : ''}`);
      applied += 1;
    }
    const { rows: stats } = await db.query<{ total: string; photo: string; tour: string }>(
      `select count(*) total,
              count(*) filter (where image_url is not null) photo,
              count(*) filter (where image_url is null and tour_photo_id is not null) tour
         from public.holy_sites`,
    );
    const stat = stats[0] ?? { total: '?', photo: '0', tour: '0' };
    console.log(`\n반영 ${applied} · 건너뜀 ${skipped}`);
    console.log(
      `사진 있는 성지 ${stat.photo} + 관광공사 실시간 ${stat.tour} = ${Number(stat.photo) + Number(stat.tour)} / ${stat.total}`,
    );
  }
} finally {
  await db.end();
}
