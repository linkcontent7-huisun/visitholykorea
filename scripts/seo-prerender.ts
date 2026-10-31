/**
 * `vite build` 뒤에 돈다 — dist/ 에 성지·코스별 HTML, sitemap.xml, robots.txt 를 써 넣는다.
 * 무엇을 왜 만드는지는 `lib/seo-pages.ts` 머리말.
 *
 * Vercel 은 파일이 있으면 rewrites(전부 index.html) 보다 파일을 먼저 돌려주므로
 * `/sites/<id>` 요청에 `dist/sites/<id>/index.html` 이 나간다.
 * 서비스워커 사전 캐시 목록은 vite build 때 이미 정해지므로 이 파일들은 거기 끼지 않는다.
 *
 * DB 를 못 읽으면 빌드를 깨지 않고 경고만 남긴다 — 검색 노출보다 앱 배포가 먼저다.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { REGIONS } from '../src/shared/lib/regions.ts';
import { loadEnvLocal } from './lib/env.ts';
import {
  renderPage,
  robotsTxt,
  routeMeta,
  siteMeta,
  sitemapXml,
  type SeoRoute,
  type SeoSite,
} from './lib/seo-pages.ts';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

// Vercel 빌드에는 환경변수가 이미 있고 .env.local 이 없다. 로컬에서만 파일을 읽는다.
if (!process.env.VITE_SUPABASE_URL && existsSync(join(ROOT, '.env.local'))) loadEnvLocal();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

async function fetchRows<T>(query: string): Promise<T[]> {
  const res = await fetch(`${url}/rest/v1/${query}`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${query} → HTTP ${res.status}`);
  return (await res.json()) as T[];
}

function write(path: string, body: string) {
  const file = join(DIST, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, body);
}

async function main() {
  const template = readFileSync(join(DIST, 'index.html'), 'utf-8');
  // robots.txt 는 DB 와 상관없이 늘 쓴다
  write('robots.txt', robotsTxt());

  if (!url || !key) {
    console.warn('[seo] Supabase 환경변수가 없어 성지별 HTML·sitemap 을 건너뜁니다.');
    return;
  }

  const sites = (
    await fetchRows<{
      id: string;
      name: string;
      seo_title: string | null;
      seo_description: string | null;
      description: string | null;
      location: string | null;
      region_province: string | null;
      lat: number | null;
      lng: number | null;
      image_url: string | null;
    }>(
      'holy_sites?select=id,name,seo_title,seo_description,description,location,region_province,lat,lng,image_url&order=name',
    )
  ).map<SeoSite>((r) => ({
    id: r.id,
    name: r.name,
    seoTitle: r.seo_title,
    seoDescription: r.seo_description,
    description: r.description,
    location: r.location,
    regionProvince: r.region_province,
    lat: r.lat,
    lng: r.lng,
    imageUrl: r.image_url,
  }));
  const routes = await fetchRows<SeoRoute>(
    'pilgrimage_routes?select=slug,title,subtitle,description&order=sort_order',
  );

  for (const meta of [...sites.map(siteMeta), ...routes.map(routeMeta)]) {
    write(join(meta.path, 'index.html'), renderPage(template, meta));
  }

  const paths = [
    '/',
    '/search',
    '/routes',
    '/nearby',
    '/compass',
    '/faq',
    ...REGIONS.map((r) => `/region/${r}`),
    ...routes.map((r) => `/routes/${r.slug}`),
    ...sites.map((s) => `/sites/${s.id}`),
  ];
  write('sitemap.xml', sitemapXml(paths));
  console.log(
    `[seo] 성지 ${sites.length}곳 · 코스 ${routes.length}개 HTML, sitemap ${paths.length}개 주소`,
  );
}

main().catch((e: unknown) => {
  console.warn('[seo] 건너뜀 —', e instanceof Error ? e.message : e);
});
