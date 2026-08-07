/**
 * 채워 넣은 번역 파일을 DB 에 넣는다.
 *
 *   npm run translate:import -- data/translations/en-대전.todo.json
 *   npm run translate:import -- data/translations/en-대전.todo.json --reviewed
 *
 * 빈 칸은 건드리지 않는다. 소개글만 먼저 번역해 넣고 역사를 나중에 넣어도
 * 앞서 넣은 값이 지워지지 않는다 — 기존 행을 읽어 채워진 값만 덮어쓴다.
 *
 * `--reviewed` 를 주면 `translation_status` 를 'reviewed' 로 넣는다.
 * 기본값은 'machine' 이다. 종교 용어는 오역이 곧 신뢰 문제라, 사람이 봤는지를
 * 숨기지 않고 표에 남긴다.
 */

import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';
import { createAdminClient } from './lib/admin.ts';
import { hasContent, parseTranslationFile } from './lib/translation-file.ts';

loadEnvLocal();

// ---------------------------------------------------------------------------
// 인자
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const reviewed = args.includes('--reviewed');
const pathArg = args.find((a) => !a.startsWith('--'));

if (!pathArg) {
  console.error('번역 파일 경로를 주세요.\n  npm run translate:import -- data/translations/en-대전.todo.json');
  process.exit(1);
}

const filePath = isAbsolute(pathArg) ? pathArg : join(ROOT, pathArg);

// ---------------------------------------------------------------------------

let file;
try {
  file = parseTranslationFile(JSON.parse(readFileSync(filePath, 'utf-8')));
} catch (e) {
  console.error(`파일을 읽지 못했습니다 (${filePath}):`, e instanceof Error ? e.message : e);
  process.exit(1);
}

const filled = file.items.filter((item) => hasContent(item.target));
const empty = file.items.length - filled.length;

if (filled.length === 0) {
  console.error('채워진 번역이 없습니다. target 을 먼저 채우세요.');
  process.exit(1);
}

const supabase = createAdminClient();

/** DB 의 기존 번역 행. 부분 갱신할 때 기존 값을 지우지 않으려고 먼저 읽는다. */
interface ExistingRow {
  site_id: string;
  name: string | null;
  description: string | null;
  history: string | null;
  address_romanized: string | null;
}

const { data: existingData, error: existingError } = await supabase
  .from('holy_site_translations')
  .select('site_id, name, description, history, address_romanized')
  .eq('language', file.language)
  .in(
    'site_id',
    filled.map((i) => i.siteId),
  );

if (existingError) {
  console.error('기존 번역 조회 실패:', existingError.message);
  process.exit(1);
}

const existing = new Map(
  ((existingData ?? []) as ExistingRow[]).map((r) => [r.site_id, r] as const),
);

/** 채워진 값만 쓰고, 빈 값은 기존 값을 남긴다. */
function pick(next: string | null, prev: string | null | undefined): string | null {
  if (typeof next === 'string' && next.trim() !== '') return next.trim();
  return prev ?? null;
}

const rows = filled.map((item) => {
  const prev = existing.get(item.siteId);
  return {
    site_id: item.siteId,
    language: file.language,
    name: pick(item.target.name, prev?.name),
    description: pick(item.target.description, prev?.description),
    history: pick(item.target.history, prev?.history),
    address_romanized: pick(item.target.addressRomanized, prev?.address_romanized),
    translation_status: reviewed ? 'reviewed' : 'machine',
    updated_at: new Date().toISOString(),
  };
});

const { error: upsertError } = await supabase
  .from('holy_site_translations')
  .upsert(rows, { onConflict: 'site_id,language' });

if (upsertError) {
  console.error('넣기 실패:', upsertError.message);
  process.exit(1);
}

const updated = rows.filter((r) => existing.has(r.site_id)).length;

console.log(`\n번역 반영 완료 — ${file.language}`);
console.log(`  새로 넣음   ${rows.length - updated}곳`);
console.log(`  갱신        ${updated}곳`);
if (empty > 0) console.log(`  건너뜀      ${empty}곳 (아직 안 채워짐)`);
console.log(`  상태        ${reviewed ? 'reviewed (사람 감수)' : 'machine (초벌)'}\n`);
