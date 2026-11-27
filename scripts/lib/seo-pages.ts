/**
 * 검색엔진·AI 검색기·인스타/카톡 미리보기용 "주소별 첫 HTML" 을 만든다.
 *
 * 앱은 index.html 한 장을 모든 주소에 돌려주는 SPA 라, 자바스크립트를 실행하지 않는
 * 검색기·AI 크롤러·링크 미리보기는 213곳 어디로 와도 앱 소개 한 장만 봤다(2026-10-31 실측).
 * 그래서 빌드 뒤에 성지·코스마다 제목·설명·구조화 데이터를 넣은 HTML 을 따로 써 둔다.
 * 네트워크·파일을 만지지 않는 순수 함수만 둔다 — 테스트하기 쉽게.
 */

import { FAQ } from '../../src/pages/content/faq.ts';
import { cardLanguage } from '../../src/features/baptism-card/lib/card-image.ts';
import { GUIDE } from '../../src/pages/content/guide.ts';
import { DICTIONARY, fillPlaceholders } from '../../src/shared/i18n/dictionary.ts';
import { haversineKm } from '../../src/shared/lib/geo.ts';
import { REGION_COORDS, type Region } from '../../src/shared/lib/regions.ts';

export const SITE_ORIGIN = 'https://visitholykorea.com';

/**
 * 공유 미리보기 그림 주소 — `api/og.ts` 가 제목·부제를 넣어 1200×630 으로 그린다(v7.0).
 * 사진이 없는 성지·코스·첫 화면이 로고 대신 이것을 쓴다.
 */
export function ogCardUrl(title: string, sub?: string | null): string {
  const q = new URLSearchParams({ title });
  if (sub) q.set('sub', sub);
  return `${SITE_ORIGIN}/api/og?${q.toString()}`;
}

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
  /** `<html lang>` — 없으면 index.html 의 ko 그대로. 영어 카드가 ko 로 신고되지 않게 */
  lang?: string;
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
  // '성지순례' 검색어를 노린 꼬리(2026-11-16 사장님 결정, B안). src/app/routes/document-title.ts 와 같아야 한다
  const title = `${site.seoTitle?.trim() || site.name} | 천주교 성지순례 · 비지트홀리코리아`;
  const description = clip(
    site.seoDescription?.trim() || site.description?.trim() || `${site.name} — 한국 천주교 성지`,
  );
  const image = site.imageUrl || ogCardUrl(site.name, site.regionProvince || site.location);
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

/** 「성지순례, 처음이라면」 안내 글 — '성지순례' 검색어를 노린다(2026-11-16) */
export function guideMeta(): PageMeta {
  const path = '/guide';
  const title =
    '성지순례 처음 가는 법 - 어디로·미사 시간·순례 예절 | 천주교 성지순례 · 비지트홀리코리아';
  const description =
    '처음 가는 한국 천주교 성지순례 안내. 가까운 성지 찾기, 하루 순례 코스, 미사 시간 확인, 성지에서 지킬 예절까지.';
  return {
    path,
    title,
    description,
    image: ogCardUrl('성지순례, 처음이라면', '비지트홀리코리아'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: '성지순례, 처음이라면',
      inLanguage: 'ko',
      url: `${SITE_ORIGIN}${path}`,
    },
    bodyHtml: guideBodyHtml(),
  };
}

/** 자바스크립트를 안 돌리는 검색기도 안내 글 전체를 읽게 한국어 본문을 그대로 넣는다 */
function guideBodyHtml(): string {
  const g = GUIDE.ko;
  return [
    `<h1>${escapeHtml(g.title)}</h1>`,
    `<p>${escapeHtml(g.lead)}</p>`,
    ...g.sections.map(
      (s) =>
        `<h2>${escapeHtml(s.heading)}</h2>` +
        (s.body ? `<p>${escapeHtml(s.body)}</p>` : '') +
        (s.items
          ? `<ul>${s.items.map((i) => `<li>${escapeHtml(i.text)}</li>`).join('')}</ul>`
          : ''),
    ),
  ].join('');
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
  return {
    path,
    title,
    description,
    image: ogCardUrl(route.title, route.subtitle),
    jsonLd,
    bodyHtml,
  };
}

/** 메신저 미리보기에 뜨는 카드 제목·설명 — 앱의 `baptismCardShareText` 와 같은 말 */
const CARD_TEXT: Record<string, { title: string; description: string }> = {
  ko: {
    title: '「{name}」 세례명 카드',
    description:
      '「{name}」 세례명으로 만나는 한국 성지예요. 눌러서 카드를 보고, 내 세례명 카드도 만들어 보세요.',
  },
  en: {
    title: 'Baptismal name card: {name}',
    description:
      'Korean holy sites for the baptismal name {name}. Open the card and make one for your own name.',
  },
  es: {
    title: 'Tarjeta del nombre de bautismo: {name}',
    description:
      'Santuarios de Corea para el nombre de bautismo {name}. Abre la tarjeta y crea la de tu nombre.',
  },
  fr: {
    title: 'Carte du nom de baptême : {name}',
    description:
      'Les sanctuaires de Corée pour le nom de baptême {name}. Ouvrez la carte et créez celle de votre nom.',
  },
  pt: {
    title: 'Cartão do nome de batismo: {name}',
    description:
      'Santuários da Coreia para o nome de batismo {name}. Abra o cartão e crie o do seu nome.',
  },
  it: {
    title: 'Carta del nome di battesimo: {name}',
    description:
      'I santuari della Corea per il nome di battesimo {name}. Apri la carta e crea quella del tuo nome.',
  },
};

/**
 * 공유받은 세례명 카드(`/card/<언어>/<영어 세례명>`)의 미리보기.
 * 그림은 `public/baptism-cards/og/` 의 JPG — 카카오톡 등 미리보기 수집기가 webp 를 못 읽는 경우가 있어
 * 따로 만들어 둔다(scripts/make-card-og.sh).
 */
export function cardMeta(language: string, slug: string, name: string): PageMeta {
  const path = `/card/${language}/${slug}`;
  const text = CARD_TEXT[language] ?? CARD_TEXT.en!;
  const title = `${text.title.replace('{name}', name)} | Visit Holy Korea`;
  const description = text.description.replace('{name}', name);
  const image = `${SITE_ORIGIN}/baptism-cards/og/${cardLanguage(language, slug)}/${slug}.jpg`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: `${SITE_ORIGIN}${path}`,
    image,
  };
  // 본문은 카드 화면(BaptismCardPage)에 실제로 있는 글 — 그림 설명(h1)과 사이트로 가는 버튼
  const lang = language in DICTIONARY.baptismCardAlt ? (language as 'ko') : 'en';
  const alt = fillPlaceholders(DICTIONARY.baptismCardAlt[lang], { name });
  const bodyHtml = [
    `<h1>${escapeHtml(alt)}</h1>`,
    `<p>${escapeHtml(description)}</p>`,
    `<p><a href="/">${escapeHtml(DICTIONARY.baptismCardVisit[lang])}</a></p>`,
  ].join('');
  return { path, title, description, image, jsonLd, bodyHtml, lang: language };
}

/** 시·도 화면(RegionLandingPage)과 같은 반경 — 바꾸면 둘을 같이 바꾼다 */
export const REGION_RADIUS_KM = 45;

/**
 * `/region/<시·도>` — 화면과 같은 계산(시·도 중심에서 45km 안, 가까운 순)으로 성지 목록을 넣는다.
 * 글은 화면의 한국어 문구(regionHero* 등)를 그대로 쓴다. 새 문장을 짓지 않는다.
 */
export function regionMeta(region: Region, sites: readonly SeoSite[]): PageMeta {
  const path = `/region/${region}`;
  const ko = (key: keyof typeof DICTIONARY) =>
    fillPlaceholders((DICTIONARY[key] as { ko: string }).ko, {
      region,
      radius: REGION_RADIUS_KM,
    });
  const heading = `${ko('regionHeroTitle')} ${ko('regionHeroTitleLine2')}`;
  // 탭 제목 규칙(document-title.ts titleFromHeading)과 같은 모양: 「화면 제목 | Visit Holy Korea」
  const title = `${heading} | Visit Holy Korea`;
  const description = ko('regionHeroSubtitle');
  const center = REGION_COORDS[region];
  const nearby = sites
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({ site: s, km: haversineKm(center.lat, center.lng, s.lat!, s.lng!) }))
    .filter((x) => x.km <= REGION_RADIUS_KM)
    .sort((a, b) => a.km - b.km);
  const countLine = `${fillPlaceholders(DICTIONARY.siteCountUnit.ko, { count: nearby.length })} · ${fillPlaceholders(
    DICTIONARY.regionSiteCountLabel.ko,
    { region, radius: REGION_RADIUS_KM, total: sites.length },
  )}`;
  const bodyHtml = [
    `<h1>${escapeHtml(heading)}</h1>`,
    `<p>${escapeHtml(description)}</p>`,
    `<p>${escapeHtml(countLine)}</p>`,
    nearby.length
      ? `<ul>${nearby
          .map(
            ({ site }) =>
              `<li><a href="/sites/${encodeURIComponent(site.id)}">${escapeHtml(site.name)}</a>${
                site.location ? ` — ${escapeHtml(site.location)}` : ''
              }</li>`,
          )
          .join('')}</ul>`
      : '',
  ].join('');
  return {
    path,
    title,
    description,
    image: ogCardUrl(heading, '비지트홀리코리아'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: heading,
      description,
      inLanguage: 'ko',
      url: `${SITE_ORIGIN}${path}`,
    },
    bodyHtml,
  };
}

/** `/faq` — 화면(FaqPage)의 한국어 문답을 그대로 넣는다. 탭에 숨은 둘째 묶음도 함께 */
export function faqMeta(): PageMeta {
  const path = '/faq';
  const heading = DICTIONARY.faqPageTitle.ko;
  const description = DICTIONARY.faqPageSub.ko;
  const f = FAQ.ko;
  const bodyHtml = [
    `<h1>${escapeHtml(heading)}</h1>`,
    `<p>${escapeHtml(description)}</p>`,
    ...f.tabs.map(
      (tab, i) =>
        `<h2>${escapeHtml(tab)}</h2>` +
        f.items[i]!.map((it) => `<h3>${escapeHtml(it.q)}</h3><p>${escapeHtml(it.a)}</p>`).join(''),
    ),
  ].join('');
  return {
    path,
    title: `${heading} | Visit Holy Korea`,
    description,
    image: ogCardUrl(heading, '비지트홀리코리아'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'ko',
      url: `${SITE_ORIGIN}${path}`,
      mainEntity: f.items.flat().map((it) => ({
        '@type': 'Question',
        name: it.q,
        acceptedAnswer: { '@type': 'Answer', text: it.a },
      })),
    },
    bodyHtml,
  };
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
    .replace(/<html lang="[^"]*">/, `<html lang="${escapeHtml(meta.lang ?? 'ko')}">`)
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
