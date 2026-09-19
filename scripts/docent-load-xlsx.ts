/**
 * 사장님 번역 작업지(xlsx → JSON)의 it/fr/pt/es 지점 원고를 docent_scripts 에 넣는다.
 * 입력 JSON: [{ siteId, seq, lang, body }]  (scripts 폴더 밖 python 이 xlsx 를 검증해 만든다)
 * 제목은 언어별 번역이 없으므로 영어 행의 제목을 쓰고, 여는 말·맺음말은 언어별 고정 문구.
 * 사용: npx tsx scripts/docent-load-xlsx.ts <json>
 */
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { loadEnvLocal } from './lib/env.ts';

loadEnvLocal();
type Row = { siteId: string; seq: number; lang: 'it' | 'fr' | 'pt' | 'es'; body: string };
const rows: Row[] = JSON.parse(readFileSync(process.argv[2]!, 'utf8'));

const FIXED: Record<Row['lang'], { intro: string; outro: string }> = {
  it: { intro: 'Benvenuti', outro: 'Congedo' },
  fr: { intro: 'Bienvenue', outro: 'Au revoir' },
  pt: { intro: 'Boas-vindas', outro: 'Despedida' },
  es: { intro: 'Bienvenida', outro: 'Despedida' },
};

const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await c.connect();
const en = await c.query<{ site_id: string; seq: number; title: string; sources: unknown }>(
  `select site_id, seq, title, sources from docent_scripts where language = 'en' and kind = 'point'`,
);
const enTitle = new Map(en.rows.map((r) => [`${r.site_id}:${r.seq}`, r]));

let n = 0;
for (const r of rows) {
  const base = enTitle.get(`${r.siteId}:${r.seq}`);
  const title =
    r.seq === 0
      ? FIXED[r.lang].intro
      : r.seq === 99
        ? FIXED[r.lang].outro
        : (base?.title ?? `${r.seq}`);
  await c.query(
    `insert into docent_scripts (site_id, language, kind, seq, title, body, look_for, sources, status, written_by)
     values ($1, $2, 'point', $3, $4, $5, null, $6, 'draft', $7)
     on conflict (site_id, language, kind, seq) do update
       set title = excluded.title, body = excluded.body, sources = excluded.sources, written_by = excluded.written_by, updated_at = now()`,
    [
      r.siteId,
      r.lang,
      r.seq,
      title,
      r.body,
      JSON.stringify(base?.sources ?? []),
      '사장님 번역(AI) + Claude 검수 2026-09-19',
    ],
  );
  n++;
}
const cnt = await c.query(
  `select language, count(*)::int n, count(distinct site_id)::int sites from docent_scripts where kind='point' group by 1 order by 1`,
);
await c.end();
console.log(`적재 ${n}행`);
for (const x of cnt.rows) console.log(`  ${x.language} point: ${x.n}행 · 성지 ${x.sites}곳`);
