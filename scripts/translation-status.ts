/**
 * 번역 진행률 — 어디까지 왔는지 교구별로 본다.
 *
 *   npm run translate:status
 *   npm run translate:status -- --lang en
 *
 * 206곳을 여러 세션에 걸쳐 나눠 하므로, 다음에 어느 교구를 잡을지
 * 이 표를 보고 정한다. 한 교구를 통째로 끝내는 편이 심사에서 보여주기 좋다.
 */

import { loadEnvLocal } from './lib/env.ts';
import { connectAdminDb } from './lib/db.ts';

loadEnvLocal();

const langIndex = process.argv.indexOf('--lang');
const language = (langIndex === -1 ? null : process.argv[langIndex + 1]) ?? 'en';

const db = await connectAdminDb();

interface SiteRow {
  id: string;
  diocese: string | null;
  description: string | null;
  history: string | null;
}

interface TransRow {
  site_id: string;
  description: string | null;
  translation_status: string;
}

const [{ rows: sites }, { rows: translations }] = await Promise.all([
  db.query<SiteRow>('select id, diocese, description, history from public.holy_sites'),
  db.query<TransRow>(
    `select site_id, description, translation_status
       from public.holy_site_translations where language = $1`,
    [language],
  ),
]);

await db.end();

// 소개글이 실제로 채워진 것만 "완료"로 센다. 빈 행이 있어도 완료로 세지 않는다.
const doneIds = new Set(
  translations.filter((t) => (t.description ?? '').trim() !== '').map((t) => t.site_id),
);
const reviewedIds = new Set(
  translations.filter((t) => t.translation_status === 'reviewed').map((t) => t.site_id),
);

const pad = (text: string, width: number) => {
  const visual = [...text].reduce((s, c) => s + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0);
  return text + ' '.repeat(Math.max(0, width - visual));
};

const byDiocese = new Map<string, { total: number; done: number; chars: number }>();
for (const s of sites) {
  const key = s.diocese ?? '(미지정)';
  const e = byDiocese.get(key) ?? { total: 0, done: 0, chars: 0 };
  e.total += 1;
  if (doneIds.has(s.id)) e.done += 1;
  else e.chars += (s.description?.length ?? 0) + (s.history?.length ?? 0);
  byDiocese.set(key, e);
}

console.log(`\n번역 진행률 — ${language}\n`);
console.log(`  전체     ${doneIds.size} / ${sites.length}곳`);
console.log(`  감수 완료 ${reviewedIds.size}곳`);

const remainingChars = [...byDiocese.values()].reduce((sum, e) => sum + e.chars, 0);
console.log(`  남은 분량 ${remainingChars.toLocaleString()}자\n`);

console.log(`${pad('교구', 12)}${pad('완료', 12)}${pad('남은 분량', 12)}진행`);
console.log('-'.repeat(52));

[...byDiocese.entries()]
  .sort((a, b) => b[1].done / b[1].total - a[1].done / a[1].total || b[1].total - a[1].total)
  .forEach(([name, e]) => {
    const pctDone = Math.round((e.done / e.total) * 100);
    const bar = '█'.repeat(Math.round(pctDone / 10)).padEnd(10, '·');
    console.log(
      `${pad(name, 12)}${pad(`${e.done}/${e.total}`, 12)}${pad(e.chars.toLocaleString(), 12)}${bar} ${pctDone}%`,
    );
  });

console.log();
