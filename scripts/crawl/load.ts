/** 수집 결과를 관리자만 실행하는 DB 적재 형식으로 바꾼다. 기본값은 DB를 건드리지 않는다. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from '../lib/env.ts';

interface ArticleInput {
  source: 'catholicnews' | 'cpbc' | 'catholictimes' | 'other';
  url: string;
  title: string;
  published_at: string | null;
  author: string | null;
  summary: string;
  excerpt: string;
  topics: string[];
  facts: {
    sites?: string[];
    artworks?: Array<{ title: string; artist?: string | null; kind?: string }>;
  };
}
const dryRun = process.argv.includes('--dry-run');
const file = join(ROOT, 'data', 'research', 'articles.jsonl');
const articles: ArticleInput[] = readFileSync(file, 'utf-8')
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line) as ArticleInput);
const unique = [...new Map(articles.map((article) => [article.url, article])).values()];

if (dryRun) {
  const sites = new Set(unique.flatMap((article) => article.facts.sites ?? []));
  const artworks = unique.flatMap((article) => article.facts.artworks ?? []);
  console.log(`건너뛴 중복 URL ${articles.length - unique.length}건`);
  console.log(`articles upsert ${unique.length}건`);
  console.log(`article_sites 후보 ${sites.size}곳`);
  console.log(`site_artworks 후보 ${artworks.length}건`);
  process.exit(0);
}

// 실제 실행은 지시자가 맡는다. 이 호출은 스크립트를 직접 실행할 때에만 .env.local을 읽는다.
loadEnvLocal();
const { connectAdminDb } = await import('../lib/db.ts');
const db = await connectAdminDb();
try {
  await db.query('begin');
  const siteRows = await db.query<{ id: string; name: string }>(
    'select id, name from public.holy_sites',
  );
  const siteIds = new Map(siteRows.rows.map((site) => [site.name, site.id]));
  for (const article of unique) {
    if (article.excerpt.length > 200) throw new Error(`인용문이 200자를 넘습니다: ${article.url}`);
    const result = await db.query<{ id: string }>(
      `insert into public.articles (source, url, title, published_at, author, summary, excerpt, topics, facts)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
      on conflict (url) do update set title=excluded.title, published_at=excluded.published_at, author=excluded.author,
      summary=excluded.summary, excerpt=excluded.excerpt, topics=excluded.topics, facts=excluded.facts, fetched_at=now()
      returning id`,
      [
        article.source,
        article.url,
        article.title,
        article.published_at,
        article.author,
        article.summary,
        article.excerpt,
        article.topics,
        JSON.stringify(article.facts),
      ],
    );
    const articleId = result.rows[0]?.id;
    if (!articleId) throw new Error(`기사 upsert 결과에 ID가 없습니다: ${article.url}`);
    for (const name of article.facts.sites ?? []) {
      const siteId = siteIds.get(name);
      if (!siteId) continue;
      await db.query(
        'insert into public.article_sites (article_id, site_id, confidence) values ($1,$2,$3) on conflict (article_id, site_id) do update set confidence=excluded.confidence',
        [articleId, siteId, 1],
      );
      for (const artwork of article.facts.artworks ?? []) {
        if (!artwork.title || !artwork.kind) continue;
        await db.query(
          `insert into public.site_artworks (site_id, kind, title, artist, description, article_id)
          values ($1,$2,$3,$4,$5,$6) on conflict (site_id, kind, title, article_id) do update set artist=excluded.artist, description=excluded.description`,
          [
            siteId,
            artwork.kind,
            artwork.title,
            artwork.artist ?? null,
            '기사에서 언급된 예술품 후보입니다. 원문과 현장 자료를 대조해 설명을 보완해야 합니다.',
            articleId,
          ],
        );
      }
    }
  }
  await db.query('commit');
  console.log(`적재 완료: articles ${unique.length}건`);
} catch (error) {
  await db.query('rollback');
  throw error;
} finally {
  await db.end();
}
