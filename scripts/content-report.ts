/**
 * 콘텐츠 현황 리포트 — "무엇부터 채울 것인가"를 숫자로 정한다.
 *
 * 208곳을 전부 채우는 건 남은 기간에 불가능하다. 그러면 어디부터 손대야 하는가.
 * 감이 아니라 실제 DB를 세어서 정한다.
 *
 *   npm run content
 */

import { loadEnvLocal } from './lib/env.ts';

loadEnvLocal();

const { supabase } = await import('../src/shared/api/supabase.ts');

interface Row {
  id: string;
  name: string;
  diocese: string | null;
  category: string | null;
  description: string | null;
  history: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  emotion_tag: string | null;
}

const { data, error } = await supabase
  .from('holy_sites')
  .select('id, name, diocese, category, description, history, image_url, lat, lng, emotion_tag');

if (error) {
  console.error('조회 실패:', error.message);
  process.exit(1);
}

const rows = (data ?? []) as Row[];
const has = (v: unknown) => v !== null && v !== undefined && String(v).trim() !== '';
const located = (r: Row) => r.lat != null && r.lng != null;

const pad = (text: string, width: number) => {
  const visual = [...text].reduce((s, c) => s + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0);
  return text + ' '.repeat(Math.max(0, width - visual));
};
const pct = (n: number) => `${Math.round((n / rows.length) * 100)}%`;

console.log(`\n성지 콘텐츠 현황 — 전체 ${rows.length}곳\n`);

const counts = {
  좌표: rows.filter(located).length,
  소개글: rows.filter((r) => has(r.description)).length,
  역사: rows.filter((r) => has(r.history)).length,
  사진: rows.filter((r) => has(r.image_url)).length,
  감정태그: rows.filter((r) => has(r.emotion_tag)).length,
};

console.log(`${pad('항목', 12)}${pad('있음', 8)}비율`);
console.log('-'.repeat(34));
for (const [k, v] of Object.entries(counts)) {
  console.log(`${pad(k, 12)}${pad(String(v), 8)}${pct(v)}`);
}

// ---------------------------------------------------------------------------
// 우선순위: 좌표 O + 소개글 O = 지금 당장 번역만 하면 완결되는 성지
// ---------------------------------------------------------------------------
const ready = rows.filter((r) => located(r) && has(r.description));
const needCoords = rows.filter((r) => !located(r) && has(r.description));
const needText = rows.filter((r) => located(r) && !has(r.description));
const needBoth = rows.filter((r) => !located(r) && !has(r.description));

console.log(`\n\n우선순위 구간\n`);
console.log(`${pad('구간', 34)}${pad('곳', 6)}해야 할 일`);
console.log('-'.repeat(72));
console.log(`${pad('① 좌표 O · 소개글 O', 34)}${pad(String(ready.length), 6)}번역만 하면 완결`);
console.log(`${pad('② 좌표 O · 소개글 X', 34)}${pad(String(needText.length), 6)}글 쓰기 → 번역`);
console.log(`${pad('③ 좌표 X · 소개글 O', 34)}${pad(String(needCoords.length), 6)}좌표 확보 → 번역`);
console.log(`${pad('④ 좌표 X · 소개글 X', 34)}${pad(String(needBoth.length), 6)}둘 다 (후순위)`);

// ---------------------------------------------------------------------------
// 번역 분량 — 실제로 얼마나 되는 일인지
// ---------------------------------------------------------------------------
const chars = ready.reduce((sum, r) => sum + (r.description?.length ?? 0), 0);
console.log(`\n① 구간 번역 분량: 총 ${chars.toLocaleString()}자`);
console.log(`   성지당 평균 ${Math.round(chars / Math.max(ready.length, 1))}자`);

// ---------------------------------------------------------------------------
// 교구별 — 한 교구를 통째로 끝내는 편이 심사에서 보여주기 좋다
// ---------------------------------------------------------------------------
const byDiocese = new Map<string, { total: number; ready: number }>();
for (const r of rows) {
  const key = r.diocese ?? '(미지정)';
  const e = byDiocese.get(key) ?? { total: 0, ready: 0 };
  e.total += 1;
  if (located(r) && has(r.description)) e.ready += 1;
  byDiocese.set(key, e);
}

console.log(`\n\n교구별 — ① 구간 비율이 높은 순\n`);
console.log(`${pad('교구', 14)}${pad('전체', 7)}${pad('완결가능', 10)}비율`);
console.log('-'.repeat(46));
[...byDiocese.entries()]
  .sort((a, b) => b[1].ready / b[1].total - a[1].ready / a[1].total || b[1].ready - a[1].ready)
  .forEach(([name, e]) => {
    console.log(
      `${pad(name, 14)}${pad(String(e.total), 7)}${pad(String(e.ready), 10)}${Math.round((e.ready / e.total) * 100)}%`,
    );
  });

console.log(`\n\n① 구간 성지 (번역 대상 후보)\n`);
ready.slice(0, 25).forEach((r, i) => {
  console.log(`${pad(String(i + 1), 4)}${pad(r.diocese ?? '-', 8)}${r.name}`);
});
if (ready.length > 25) console.log(`   … 외 ${ready.length - 25}곳`);
console.log();
