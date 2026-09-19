/**
 * 도슨트 원고를 DB(docent_scripts)에 올린다.
 *
 *   npm run docent:load            — data/docent 아래 전부
 *   npm run docent:load -- 공세리   — 파일명에 그 글자가 든 것만
 *
 * 읽는 것:
 *   data/docent/소개글/<성지>.md   — kind=intro. 머리(---)에 siteId·language·status·sources, 본문이 낭독문
 *   data/docent/<성지>.json         — kind=point. 현장 지점 원고(_템플릿.json 형식). intro/outro 도 seq 0·99 로 넣는다
 *
 * 같은 (site_id, language, kind, seq) 가 있으면 덮어쓴다 — 원고를 고치고 다시 돌리면 된다.
 * 사장님 지시(2026-09-17): 사진·안내 설명글은 전부 DB 화. 저장소 파일은 작성·검토용 원본이고 앱은 DB 를 읽는다.
 */
import pg from 'pg';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';

loadEnvLocal();
const filter = process.argv[2] ?? '';
const DIR = join(ROOT, 'data', 'docent');

interface Row {
  site_id: string;
  language: string;
  kind: 'intro' | 'point';
  seq: number;
  title: string | null;
  body: string;
  look_for: string | null;
  sources: unknown;
  status: string;
  written_by: string | null;
}

/** 아주 작은 front-matter 파서 — 우리 md 머리만 읽는다 (key: value, sources 는 - label/url 목록) */
function parseMd(text: string): {
  meta: Record<string, string>;
  sources: { label: string; url?: string }[];
  body: string;
} {
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m || m[1] === undefined || m[2] === undefined) throw new Error('front-matter(---) 가 없다');
  const meta: Record<string, string> = {};
  const sources: { label: string; url?: string }[] = [];
  let inSources = false;
  for (const raw of m[1].split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (/^sources:/.test(line)) {
      inSources = true;
      continue;
    }
    if (inSources && /^\s+-\s+label:/.test(line)) {
      sources.push({ label: line.replace(/^\s+-\s+label:\s*/, '') });
      continue;
    }
    if (inSources && /^\s+url:/.test(line)) {
      const source = sources[sources.length - 1];
      if (!source) throw new Error('출처 URL 앞에 label 이 없다');
      source.url = line.replace(/^\s+url:\s*/, '');
      continue;
    }
    if (inSources && /^\s+-\s+/.test(line)) {
      sources.push({ label: line.replace(/^\s+-\s+/, '') });
      continue;
    }
    if (/^\S/.test(line)) {
      inSources = false;
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return { meta, sources, body: m[2].trim() };
}

const rows: Row[] = [];

// 1) 소개글 .md
const introDir = join(DIR, '소개글');
const introFiles: string[] = [];
if (existsSync(introDir)) {
  for (const f of readdirSync(introDir)) {
    const full = join(introDir, f);
    if (f.endsWith('.md')) introFiles.push(full);
    else if (existsSync(join(full, '.')))
      for (const g of readdirSync(full)) if (g.endsWith('.md')) introFiles.push(join(full, g)); // 언어별 하위 폴더(en/ …)
  }
  for (const full of introFiles.filter((n) => n.includes(filter))) {
    const f = full.slice(introDir.length + 1);
    const { meta, sources, body } = parseMd(readFileSync(full, 'utf-8'));
    if (!meta.siteId) {
      console.warn(`건너뜀 (siteId 없음): ${f}`);
      continue;
    }
    rows.push({
      site_id: meta.siteId,
      language: meta.language || 'ko',
      kind: 'intro',
      seq: 0,
      title:
        (
          {
            ko: '소개글',
            en: 'Introduction',
            es: 'Presentación',
            it: 'Presentazione',
            pt: 'Apresentação',
            fr: 'Présentation',
          } as Record<string, string>
        )[meta.language || 'ko'] ?? 'Introduction',
      body,
      look_for: null,
      sources,
      status: meta.status || 'draft',
      written_by: meta.writtenBy || null,
    });
    console.log(`소개글  ${f}  ${body.length}자`);
  }
}

// 2) 지점 원고 .json (기존 15곳 형식)
for (const f of readdirSync(DIR).filter(
  (n) => n.endsWith('.json') && !n.startsWith('_') && n.includes(filter),
)) {
  const d = JSON.parse(readFileSync(join(DIR, f), 'utf-8'));
  if (!d.siteId) {
    console.warn(`건너뜀 (siteId 없음): ${f}`);
    continue;
  }
  const langs: [string, string][] = [
    ['ko', ''],
    ['en', 'En'],
    ['es', 'Es'],
  ];
  for (const [lang, sfx] of langs) {
    const intro = d.intro?.[`narration${sfx}`];
    const outro = d.outro?.[`narration${sfx}`];
    const pts = (d.points ?? []).filter(
      (p: Record<string, unknown>) =>
        typeof p[`narration${sfx}`] === 'string' && p[`narration${sfx}`],
    );
    if (!intro || pts.length === 0) continue; // 그 언어로 안 쓴 원고는 넣지 않는다
    const src = [{ label: d.surveyedBy ?? '원고 JSON' }];
    rows.push({
      site_id: d.siteId,
      language: lang,
      kind: 'point',
      seq: 0,
      title: lang === 'ko' ? '여는 말' : 'Welcome',
      body: intro,
      look_for: null,
      sources: src,
      status: d.status === 'verified' ? 'verified' : 'draft',
      written_by: d.surveyedBy ?? null,
    });
    for (const p of pts)
      rows.push({
        site_id: d.siteId,
        language: lang,
        kind: 'point',
        seq: p.seq,
        title: p[`title${sfx}`] ?? p.title,
        body: p[`narration${sfx}`],
        look_for: p[`lookFor${sfx}`] ?? null,
        sources: p.sourceNote ? [{ label: p.sourceNote }] : src,
        status: d.status === 'verified' ? 'verified' : 'draft',
        written_by: d.surveyedBy ?? null,
      });
    if (outro)
      rows.push({
        site_id: d.siteId,
        language: lang,
        kind: 'point',
        seq: 99,
        title: lang === 'ko' ? '맺음말' : 'Farewell',
        body: outro,
        look_for: null,
        sources: src,
        status: d.status === 'verified' ? 'verified' : 'draft',
        written_by: d.surveyedBy ?? null,
      });
  }
  console.log(`지점    ${f}  ${(d.points ?? []).length}지점`);
}

if (rows.length === 0) {
  console.log('올릴 원고가 없다');
  process.exit(0);
}

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();
let n = 0;
for (const r of rows) {
  await client.query(
    `insert into public.docent_scripts (site_id, language, kind, seq, title, body, look_for, sources, status, written_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (site_id, language, kind, seq) do update set
       title = excluded.title, body = excluded.body, look_for = excluded.look_for, sources = excluded.sources,
       status = excluded.status, written_by = excluded.written_by`,
    [
      r.site_id,
      r.language,
      r.kind,
      r.seq,
      r.title,
      r.body,
      r.look_for,
      JSON.stringify(r.sources),
      r.status,
      r.written_by,
    ],
  );
  n += 1;
}
const c = await client.query(
  `select language, kind, count(*) n, count(distinct site_id) sites from public.docent_scripts group by 1,2 order by 1,2`,
);
await client.end();
console.log(`\n${n}행 올림. 표 전체:`);
for (const r of c.rows) console.log(`  ${r.language} ${r.kind}: ${r.n}행 · 성지 ${r.sites}곳`);
