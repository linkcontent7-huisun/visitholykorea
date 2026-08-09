/**
 * 번역 대상을 파일로 내보낸다.
 *
 *   npm run translate:export -- --diocese 대전
 *   npm run translate:export -- --diocese 서울 --lang en
 *   npm run translate:export                        (전체)
 *
 * 이미 번역된 성지는 빼고 내보낸다. 그래서 여러 번 돌려도 안전하고,
 * 남은 분량이 얼마인지 그 자체로 알 수 있다.
 *
 * 나온 파일의 `target` 을 채운 뒤 `npm run translate:import` 로 넣는다.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';
import { createAdminClient } from './lib/admin.ts';
import type { TranslationFile, TranslationItem } from './lib/translation-file.ts';

loadEnvLocal();

// ---------------------------------------------------------------------------
// 인자
// ---------------------------------------------------------------------------

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

const language = argValue('--lang') ?? 'en';
const diocese = argValue('--diocese');

// ---------------------------------------------------------------------------

interface SiteRow {
  id: string;
  name: string;
  diocese: string | null;
  description: string | null;
  history: string | null;
  location: string | null;
}

const supabase = createAdminClient();

let query = supabase
  .from('holy_sites')
  .select('id, name, diocese, description, history, location')
  .order('name');

if (diocese) query = query.eq('diocese', diocese);

const { data: siteData, error: siteError } = await query;
if (siteError) {
  console.error('성지 조회 실패:', siteError.message);
  process.exit(1);
}
const sites = (siteData ?? []) as SiteRow[];

// 이미 번역된 곳은 뺀다.
//
// 표가 아직 없어도 내보내기는 되어야 한다 — 번역해 둔 파일이 있어야
// 표가 생겼을 때 바로 넣을 수 있고, 표를 만드는 일과 번역하는 일은 순서가 자유롭다.
// 다만 조용히 넘어가면 "번역이 하나도 없다"로 오해하므로 크게 알린다.
const { data: doneData, error: doneError } = await supabase
  .from('holy_site_translations')
  .select('site_id')
  .eq('language', language);

let done = new Set<string>();
if (doneError) {
  const missingTable = /schema cache|does not exist/i.test(doneError.message);
  if (!missingTable) {
    console.error('기존 번역 조회 실패:', doneError.message);
    process.exit(1);
  }
  console.warn(
    '\n⚠ holy_site_translations 표가 아직 없습니다.\n' +
      '  전부 미번역으로 보고 내보냅니다. 넣기 전에 마이그레이션을 적용하세요.\n' +
      '  (supabase/migrations/20260805110000_create_holy_site_translations.sql)\n',
  );
} else {
  done = new Set((doneData ?? []).map((r) => (r as { site_id: string }).site_id));
}

const pending = sites.filter((s) => !done.has(s.id));

if (pending.length === 0) {
  console.log(`\n${diocese ?? '전체'} — ${language} 번역이 모두 끝났습니다.\n`);
  process.exit(0);
}

const items: TranslationItem[] = pending.map((s) => ({
  siteId: s.id,
  diocese: s.diocese,
  source: {
    name: s.name,
    description: s.description,
    history: s.history,
    location: s.location,
  },
  target: { name: '', description: null, history: null, addressRomanized: null },
}));

const file: TranslationFile = {
  language,
  diocese,
  generatedAt: new Date().toISOString(),
  items,
};

const outDir = join(ROOT, 'data', 'translations');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${language}-${diocese ?? 'all'}.todo.json`);
writeFileSync(outPath, `${JSON.stringify(file, null, 2)}\n`, 'utf-8');

const chars = pending.reduce(
  (sum, s) => sum + (s.description?.length ?? 0) + (s.history?.length ?? 0),
  0,
);

console.log(`\n번역 대상 — ${diocese ?? '전체'} / ${language}`);
console.log(`  남은 성지   ${pending.length}곳 (전체 ${sites.length}곳 중 ${done.size}곳 완료)`);
console.log(`  분량        ${chars.toLocaleString()}자 (소개글 + 역사)`);
console.log(`  파일        ${outPath}\n`);
