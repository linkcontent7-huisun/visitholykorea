/**
 * 순례 코스(pilgrimage_routes)·경유지 메모(pilgrimage_route_sites.note) 번역을 DB 에 넣는다.
 * 영어는 `seed-route-translations-en.ts` 에 값이 박혀 있고, 그 밖의 언어는 이 스크립트가
 * `data/translations/routes-<lang>.json` 을 읽어 같은 방식으로 넣는다(2026-09-21, T-034).
 *
 *   npx tsx scripts/seed-route-translations.ts --lang es
 *   npx tsx scripts/seed-route-translations.ts --lang es --reviewed
 *
 * 파일 형식은 영어 스크립트의 ROUTES 와 같다: [{ slug, title, subtitle, description, stopNotes[] }].
 * 경유지 메모는 순서(position)로 맞추므로 stopNotes 길이가 경유지 수와 다르면 그 코스는 건너뛴다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';
import { connectAdminDb } from './lib/db.ts';

loadEnvLocal();

const args = process.argv.slice(2);
const langIdx = args.indexOf('--lang');
const language = langIdx >= 0 ? args[langIdx + 1] : undefined;
const status = args.includes('--reviewed') ? 'reviewed' : 'machine';
if (!language || !/^[a-z]{2}$/.test(language)) {
  console.error('언어를 주세요.\n  npx tsx scripts/seed-route-translations.ts --lang es');
  process.exit(1);
}

interface RouteTranslation {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  stopNotes: (string | null)[];
}

const file = join(ROOT, 'data', 'translations', `routes-${language}.json`);
const ROUTES = JSON.parse(readFileSync(file, 'utf-8')) as RouteTranslation[];

const client = await connectAdminDb();
try {
  let routeCount = 0;
  let noteCount = 0;

  for (const r of ROUTES) {
    const { rows } = await client.query<{ id: string }>(
      'select id from public.pilgrimage_routes where slug = $1',
      [r.slug],
    );
    const route = rows[0];
    if (!route) {
      console.warn(`건너뜀 — 코스를 못 찾음: ${r.slug}`);
      continue;
    }

    await client.query(
      `insert into public.pilgrimage_route_translations (route_id, language, title, subtitle, description, translation_status)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (route_id, language) do update set
         title = excluded.title,
         subtitle = excluded.subtitle,
         description = excluded.description,
         translation_status = excluded.translation_status,
         updated_at = now()`,
      [route.id, language, r.title, r.subtitle, r.description, status],
    );
    routeCount++;

    const { rows: stops } = await client.query<{ position: number; site_id: string }>(
      'select position, site_id from public.pilgrimage_route_sites where route_id = $1 order by position',
      [route.id],
    );
    if (stops.length !== r.stopNotes.length) {
      console.warn(
        `⚠️  ${r.slug}: 경유지 수(${stops.length})와 번역 메모 수(${r.stopNotes.length})가 다릅니다 — 메모 건너뜀`,
      );
      continue;
    }
    for (const stop of stops) {
      const note = r.stopNotes[stop.position - 1];
      if (!note) continue;
      await client.query(
        `insert into public.pilgrimage_route_site_translations (route_id, site_id, language, note, translation_status)
         values ($1, $2, $3, $4, $5)
         on conflict (route_id, site_id, language) do update set
           note = excluded.note,
           translation_status = excluded.translation_status,
           updated_at = now()`,
        [route.id, stop.site_id, language, note, status],
      );
      noteCount++;
    }
    console.log(`  ${r.slug} — 제목·부제·설명 1 + 메모 ${stops.length}`);
  }

  console.log(`\n완료(${language}) — 코스 ${routeCount}개, 경유지 메모 ${noteCount}개.\n`);
} finally {
  await client.end();
}
