/**
 * 검색엔진·AI 검색기·인스타/카톡 미리보기용 "주소별 첫 HTML" 을 만든다.
 *
 * 앱은 index.html 한 장을 모든 주소에 돌려주는 SPA 라, 자바스크립트를 실행하지 않는
 * 검색기·AI 크롤러·링크 미리보기는 213곳 어디로 와도 앱 소개 한 장만 봤다(2026-10-31 실측).
 * 그래서 빌드 뒤에 성지·코스마다 제목·설명·구조화 데이터를 넣은 HTML 을 따로 써 둔다.
 * 네트워크·파일을 만지지 않는 순수 함수만 둔다 — 테스트하기 쉽게.
 */

export const SITE_ORIGIN = 'https://visitholykorea.com';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/logo.png`;

export interface SeoSite {
  id: string;
  name: string;
  seoTitle: string | null;
  seoDescription: string | null;
  description: string | null;
  location: string | null;
  regionProvince: string | null;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
}

export interface SeoRoute {
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
}

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  image: string;
  /** schema.org 구조화 데이터 — 검색기가 "이건 성지, 주소는 여기" 라고 알아듣게 */
  jsonLd: Record<string, unknown>;
  /** 자바스크립트를 안 돌리는 크롤러가 읽을 본문. 앱이 뜨면 React 가 이 자리를 덮어쓴다 */
  bodyHtml: string;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 검색 결과에 잘리지 않는 길이(약 160자)로 줄인다 */
function clip(s: string, max = 160): string {
  const one = s.replace(/\s+/g, ' ').trim();
  return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

export function siteMeta(site: SeoSite): PageMeta {
  const path = `/sites/${site.id}`;
  const title = `${site.seoTitle?.trim() || site.name} | Visit Holy Korea`;
  const description = clip(
    site.seoDescription?.trim() || site.description?.trim() || `${site.name} — 한국 천주교 성지`,
  );
  const image = site.imageUrl || DEFAULT_IMAGE;
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['TouristAttraction', 'PlaceOfWorship'],
    name: site.name,
    description,
    url: `${SITE_ORIGIN}${path}`,
    image,
    ...(site.location && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.location,
        ...(site.regionProvince && { addressRegion: site.regionProvince }),
        addressCountry: 'KR',
      },
    }),
    ...(site.lat != null &&
      site.lng != null && {
        geo: { '@type': 'GeoCoordinates', latitude: site.lat, longitude: site.lng },
      }),
  };
  const bodyHtml = [
    `<h1>${escapeHtml(site.name)}</h1>`,
    site.location ? `<p>${escapeHtml(site.location)}</p>` : '',
    site.description ? `<p>${escapeHtml(site.description.trim())}</p>` : '',
  ].join('');
  return { path, title, description, image, jsonLd, bodyHtml };
}

export function routeMeta(route: SeoRoute): PageMeta {
  const path = `/routes/${route.slug}`;
  const title = `${route.title} | Visit Holy Korea 순례 코스`;
  const description = clip(route.description || route.subtitle || route.title);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: route.title,
    description,
    url: `${SITE_ORIGIN}${path}`,
  };
  const bodyHtml = [
    `<h1>${escapeHtml(route.title)}</h1>`,
    route.subtitle ? `<p>${escapeHtml(route.subtitle)}</p>` : '',
    route.description ? `<p>${escapeHtml(route.description)}</p>` : '',
  ].join('');
  return { path, title, description, image: DEFAULT_IMAGE, jsonLd, bodyHtml };
}

/**
 * index.html 의 제목·설명·OG 태그를 갈아 끼우고 canonical·구조화 데이터·본문을 넣는다.
 * 원본 태그를 정규식으로 찾으므로, index.html 의 해당 태그 모양이 바뀌면 테스트가 먼저 깨진다.
 */
export function renderPage(template: string, meta: PageMeta): string {
  const t = escapeHtml(meta.title);
  const d = escapeHtml(meta.description);
  const url = `${SITE_ORIGIN}${meta.path}`;
  // JSON 안의 "</script>" 가 태그를 닫지 않게 < 를 유니코드 이스케이프한다
  const ld = JSON.stringify(meta.jsonLd).replace(/</g, '\\u003c');
  const extraHead = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    `<script type="application/ld+json">${ld}</script>`,
  ].join('\n    ');

  const out = template
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${d}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/, `$1${d}$2`)
    .replace('</head>', `    ${extraHead}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${meta.bodyHtml}</div>`);
  return out;
}

export function sitemapXml(paths: string[]): string {
  const urls = paths
    .map((p) => `  <url><loc>${escapeHtml(`${SITE_ORIGIN}${encodeURI(p)}`)}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
}
