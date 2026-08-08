/**
 * 성지 연락처 옮기기 — 예전 Supabase 프로젝트에서 받은 CSV 를 넣는다.
 *
 *   npm run import:contacts -- "C:/.../old-contacts.csv"
 *   npm run import:contacts -- "C:/.../old-contacts.csv" --dry
 *
 * 프로젝트가 둘로 갈라져 있었고, 지우려던 쪽에만 130곳의 전화번호·홈페이지가 있었다.
 * 지우기 전에 이쪽으로 옮긴다. 컬럼은 마이그레이션 20260808000000 이 만든다.
 *
 * **id 가 아니라 이름으로 맞춘다.** 두 프로젝트가 각각 시드되어 같은 성지라도
 * id 가 다를 수 있다. 이름이 겹치는 경우를 대비해 주소 앞부분도 함께 본다.
 *
 * 이미 값이 있는 곳은 덮어쓰지 않는다 — 옛 데이터가 더 새롭다고 볼 근거가 없다.
 */

import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';
import { createAdminClient } from './lib/admin.ts';

loadEnvLocal();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const pathArg = args.find((a) => !a.startsWith('--'));

if (!pathArg) {
  console.error('CSV 경로를 주세요.\n  npm run import:contacts -- "경로/old-contacts.csv"');
  process.exit(1);
}
const csvPath = isAbsolute(pathArg) ? pathArg : join(ROOT, pathArg);

// ---------------------------------------------------------------------------
// CSV 읽기 — 따옴표 안의 쉼표·줄바꿈까지 다룬다
// ---------------------------------------------------------------------------

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        // 따옴표 두 개는 따옴표 한 글자
        if (text[i + 1] === '"') { field += '"'; i += 1; }
        else inQuotes = false;
      } else field += c;
      continue;
    }

    if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }

  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ''));
}

/** Supabase CSV 는 빈 값을 문자열 "null" 로 쓴다. 진짜 값과 구분해야 한다. */
function value(raw: string | undefined): string | null {
  const v = (raw ?? '').trim();
  if (v === '' || v.toLowerCase() === 'null') return null;
  return v;
}

/** 이름 대조용 정규화 — 공백 차이로 못 찾는 일을 막는다 */
function normalize(name: string): string {
  return name.replace(/\s+/g, '').trim();
}

// ---------------------------------------------------------------------------

const rows = parseCsv(readFileSync(csvPath, 'utf-8'));
const header = rows[0]?.map((h) => h.trim());
if (!header) { console.error('CSV 가 비었습니다.'); process.exit(1); }

const col = {
  name: header.indexOf('name'),
  location: header.indexOf('location'),
  phone: header.indexOf('phone'),
  homepage: header.indexOf('homepage_url'),
  fax: header.indexOf('fax'),
};
if (col.name === -1) { console.error('name 열이 없습니다.'); process.exit(1); }

interface Incoming {
  name: string;
  location: string | null;
  phone: string | null;
  homepage_url: string | null;
  fax: string | null;
}

const incoming: Incoming[] = rows.slice(1).map((r) => ({
  name: (r[col.name] ?? '').trim(),
  location: col.location === -1 ? null : value(r[col.location]),
  phone: col.phone === -1 ? null : value(r[col.phone]),
  homepage_url: col.homepage === -1 ? null : value(r[col.homepage]),
  fax: col.fax === -1 ? null : value(r[col.fax]),
})).filter((r) => r.name !== '');

console.log(`\nCSV ${incoming.length}줄을 읽었습니다.\n`);

// ---------------------------------------------------------------------------

const supabase = createAdminClient();

interface SiteRow {
  id: string;
  name: string;
  location: string | null;
  phone: string | null;
  homepage_url: string | null;
  fax: string | null;
}

const { data, error } = await supabase
  .from('holy_sites')
  .select('id, name, location, phone, homepage_url, fax');

if (error) {
  console.error('성지 조회 실패:', error.message);
  if (error.message.includes('phone')) {
    console.error('\n컬럼이 아직 없습니다. SQL Editor 에서 아래를 먼저 실행하세요.\n');
    console.error("  alter table public.holy_sites");
    console.error("    add column if not exists phone text,");
    console.error("    add column if not exists homepage_url text,");
    console.error("    add column if not exists fax text;");
    console.error("  notify pgrst, 'reload schema';\n");
  }
  process.exit(1);
}

const sites = (data ?? []) as SiteRow[];

/** 이름이 겹칠 수 있으므로 배열로 담는다 */
const byName = new Map<string, SiteRow[]>();
for (const s of sites) {
  const key = normalize(s.name);
  const list = byName.get(key);
  if (list) list.push(s);
  else byName.set(key, [s]);
}

const updates: Array<{ id: string; name: string; patch: Partial<SiteRow> }> = [];
const notFound: string[] = [];
const ambiguous: string[] = [];
let alreadyFilled = 0;

for (const row of incoming) {
  const candidates = byName.get(normalize(row.name));
  if (!candidates || candidates.length === 0) { notFound.push(row.name); continue; }

  let site = candidates[0]!;
  if (candidates.length > 1) {
    // 주소 앞부분이 겹치는 쪽을 고른다
    const head = (row.location ?? '').slice(0, 6);
    const better = candidates.find((c) => (c.location ?? '').startsWith(head));
    if (!better) { ambiguous.push(row.name); continue; }
    site = better;
  }

  // 이미 값이 있으면 두지 않는다 — 옛 데이터가 더 새롭다고 볼 근거가 없다
  const patch: Partial<SiteRow> = {};
  if (row.phone && !site.phone) patch.phone = row.phone;
  if (row.homepage_url && !site.homepage_url) patch.homepage_url = row.homepage_url;
  if (row.fax && !site.fax) patch.fax = row.fax;

  if (Object.keys(patch).length === 0) { alreadyFilled += 1; continue; }
  updates.push({ id: site.id, name: site.name, patch });
}

console.log(`대조 결과`);
console.log(`  넣을 곳       ${updates.length}곳`);
console.log(`  이미 있음     ${alreadyFilled}곳`);
console.log(`  못 찾음       ${notFound.length}곳`);
console.log(`  이름 겹침     ${ambiguous.length}곳`);

if (notFound.length > 0) {
  console.log(`\n못 찾은 성지 (이름이 다르거나 이쪽에 없는 곳):`);
  for (const n of notFound.slice(0, 20)) console.log(`  - ${n}`);
  if (notFound.length > 20) console.log(`  … 외 ${notFound.length - 20}곳`);
}
if (ambiguous.length > 0) {
  console.log(`\n이름이 겹쳐 건너뛴 성지:`);
  for (const n of ambiguous) console.log(`  - ${n}`);
}

if (dryRun) {
  console.log(`\n--dry 라서 넣지 않았습니다.\n`);
  process.exit(0);
}

if (updates.length === 0) {
  console.log(`\n넣을 것이 없습니다.\n`);
  process.exit(0);
}

let done = 0;
for (const u of updates) {
  const { error: upErr } = await supabase.from('holy_sites').update(u.patch).eq('id', u.id);
  if (upErr) console.error(`  실패 ${u.name}: ${upErr.message}`);
  else done += 1;
}

console.log(`\n${done}곳에 연락처를 넣었습니다.\n`);
