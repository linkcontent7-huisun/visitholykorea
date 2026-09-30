/**
 * T-050 빠진 성지를 DB 에 올린다 — 성지(holy_sites) + 5개 국어 번역(holy_site_translations)
 * + 오디오 가이드·성지 이야기 원고 파일(data/docent/…)을 만든다. 원고 DB 반영은 그 뒤 `npm run docent:load`.
 *
 *   npx tsx scripts/missing-sites-load.ts            — 무엇을 할지 보여 주기만 한다 (기본)
 *   npx tsx scripts/missing-sites-load.ts --apply    — 실제로 넣는다
 *
 * 올리는 조건: 원고 JSON 에 한국어 + 5개 국어(en·es·it·pt·fr)가 원고·성지 정보 모두 채워져 있을 것.
 * 하나라도 비면 그 성지는 건너뛴다 — 외국어 화면에 한국어가 섞이지 않게 (9/30 사장님: "5개 언어로 번역된 것은 올려줘").
 * 같은 이름의 성지가 이미 있으면 새로 넣지 않고 그 id 를 쓴다 — 여러 번 돌려도 된다.
 */
import pg from 'pg';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';

loadEnvLocal();
const APPLY = process.argv.includes('--apply');
const SRC = join(ROOT, 'data', 'research', 'missing-sites');
const DOCENT = join(ROOT, 'data', 'docent');
const LANGS = [
  ['en', 'En'],
  ['es', 'Es'],
  ['it', 'It'],
  ['pt', 'Pt'],
  ['fr', 'Fr'],
] as const;

interface Draft {
  cbck_code: string;
  name: string;
  diocese: string;
  region_province: string;
  location: string;
  lat: number;
  lng: number;
  phone: string | null;
  sources: string[];
}
const drafts: Draft[] = JSON.parse(readFileSync(join(SRC, 'drafts.json'), 'utf-8')).sites;

/** 원고·성지 정보가 그 언어로 빠짐없이 있는가 */
function complete(d: any, sfx: string): boolean {
  const si = d.siteInfo ?? {};
  const infoKeys = sfx === 'En' ? ['name', 'description', 'history', 'story'] : ['name', 'description', 'history', 'story'];
  return Boolean(
    d.intro?.[`narration${sfx}`] &&
      d.outro?.[`narration${sfx}`] &&
      d.points.every((p: any) => p[`narration${sfx}`] && p[`title${sfx}`]) &&
      infoKeys.every((k) => si[`${k}${sfx}`]),
  );
}

const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
await client.connect();

let done = 0;
for (const f of readdirSync(join(SRC, 'docent')).filter((n) => /^\d+\.json$/.test(n))) {
  const d = JSON.parse(readFileSync(join(SRC, 'docent', f), 'utf-8'));
  const draft = drafts.find((x) => x.cbck_code === d.cbckCode);
  const si = d.siteInfo;
  if (!draft || !si) {
    console.warn(`건너뜀 ${f}: drafts.json 또는 siteInfo 없음`);
    continue;
  }
  const missing = LANGS.filter(([, sfx]) => !complete(d, sfx)).map(([l]) => l);
  if (missing.length) {
    console.warn(`건너뜀 ${draft.name}: 번역 빠짐 ${missing.join('·')}`);
    continue;
  }

  // 1) holy_sites
  const found = await client.query('select id from holy_sites where name = $1', [draft.name]);
  let siteId: string | undefined = found.rows[0]?.id;
  if (siteId) console.log(`있음   ${draft.name} (${siteId}) — 성지 행은 새로 넣지 않는다`);
  else if (APPLY) {
    const r = await client.query(
      `insert into holy_sites (name, name_compact, category, diocese, region_province, location, description, history, lat, lng, phone, emotion_tag)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
      [
        draft.name,
        draft.name.replace(/\s/g, ''),
        si.category,
        draft.diocese,
        draft.region_province,
        draft.location,
        si.description,
        si.history,
        draft.lat,
        draft.lng,
        draft.phone,
        si.emotionTag,
      ],
    );
    siteId = r.rows[0].id;
    console.log(`넣음   ${draft.name} (${siteId})`);
  } else console.log(`넣을 것 ${draft.name} · ${si.category} · ${draft.diocese}`);

  // 2) 번역 5개 국어
  for (const [lang, sfx] of LANGS) {
    if (!APPLY || !siteId) continue;
    await client.query(
      `insert into holy_site_translations (site_id, language, name, description, history, address_romanized, translation_status)
       values ($1,$2,$3,$4,$5,$6,'machine')
       on conflict (site_id, language) do update set name = excluded.name, description = excluded.description,
         history = excluded.history, address_romanized = excluded.address_romanized, updated_at = now()`,
      [siteId, lang, si[`name${sfx}`], si[`description${sfx}`], si[`history${sfx}`], si.addressRomanized],
    );
  }

  // 3) 원고 파일 — docent:load 가 읽는 자리로. siteId 가 있어야 올라간다
  if (APPLY && siteId) {
    const slug = draft.name.replace(/\s+/g, '-');
    const { siteInfo: _, ...script } = d;
    writeFileSync(join(DOCENT, `${slug}.json`), JSON.stringify({ ...script, siteId, siteName: draft.name }, null, 2) + '\n');
    const sourceLines = draft.sources.map((u) => `  - label: ${u}\n    url: ${u}`).join('\n');
    const md = (lang: string, body: string, by: string) =>
      `---\nsiteId: ${siteId}\nsiteName: ${draft.name}\nlanguage: ${lang}\nkind: intro\nstatus: draft\nwrittenBy: ${by}\nsources:\n${sourceLines}\n---\n\n${body}\n`;
    writeFileSync(join(DOCENT, '소개글', `${slug}.md`), md('ko', si.story, 'Claude (문헌 초안 2026-09-30, T-050) · Codex 검증'));
    for (const [lang, sfx] of LANGS) {
      mkdirSync(join(DOCENT, '소개글', lang), { recursive: true });
      writeFileSync(
        join(DOCENT, '소개글', lang, `${slug}.md`),
        md(lang, si[`story${sfx}`], lang === 'en' ? 'Claude (T-050)' : 'Codex 번역 (T-050)'),
      );
    }
    console.log(`원고   data/docent/${slug}.json + 소개글 6개 국어`);
  }
  done++;
}
await client.end();
console.log(`${APPLY ? '반영' : '미리보기'} ${done}곳${APPLY ? ' — 이어서 npm run docent:load' : ' — 실제로 넣으려면 --apply'}`);
