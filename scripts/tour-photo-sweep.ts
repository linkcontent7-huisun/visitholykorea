/**
 * 한국관광콘텐츠랩(api.visitkorea.or.kr) 검색으로 사진 없는 성지의 사진 후보를 훑는다.
 *
 *   npm run photos:sweep                 → data/research/tour_photo_sweep_<날짜>.csv + 요약 md
 *   npm run photos:sweep -- --only photo|tour
 *   npm run photos:sweep -- --limit 20   (시험용)
 *
 * 왜 TourAPI 가 아니라 콘텐츠랩 사이트인가 (2026-09-16 실측)
 *   - 콘텐츠랩의 검색 백엔드(`hub/getTourInfo.do`·`hub/getTourPhotoInfo.do`)는 인증키 없이 열려 있다.
 *     로컬 `.env.local` 의 TourAPI 키가 「등록되지 않은 서비스키」(403)라 API 로는 돌릴 수 없었다.
 *   - 관광정보 검색은 제목 **부분 일치**(「성지」 69건), 관광사진 검색은 제목 **완전 일치**만 된다.
 *     그래서 사진은 시·도 단위로 전부 내려받아(충북 3,130장, 500장씩) 우리가 직접 이름·태그를 대조한다.
 *     키워드에 따라 결과 품질이 크게 달라지는 이유가 이것이다 — 「배티」는 0건, 「배티성지」는 12건.
 *
 * 왜 후보만 뽑고 DB 에 쓰지 않는가
 *   - 이름이 비슷해도 다른 곳인 경우가 많다(9/15: 「죽성성당」은 드라마 세트, 「경주 계림」은 성지가 아님).
 *     사람이 이미지를 열어 보고 채택한다.
 *   - 채택한 뒤에도 이미지 주소는 저장하지 않는다. TourAPI 식별자(contentid·galContentId)만
 *     `holy_sites.tour_photo_*` 에 넣고 화면이 실시간으로 조회한다 (ADR 0002, `npm run photos:apply`).
 *     관광사진의 콘텐츠랩 식별자(예: 7ntH1a)는 TourAPI 의 galContentId 와 다르다 — 채택 시
 *     `photos:apply` 가 제목으로 관광사진 API 를 다시 검색해 같은 이미지(tong 자원 번호)로 맞춘다.
 *
 * 공공누리 유형(cpyrhtDivCd)은 응답에 들어 있다. 제1·3유형만 후보로 남긴다(제2·4유형은 상업 이용 금지).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';
import { connectAdminDb } from './lib/db.ts';

loadEnvLocal({ supabasePlaceholder: true });

const HUB = 'https://api.visitkorea.or.kr';
const PAGE = 500;

const limitIndex = process.argv.indexOf('--limit');
const limit = limitIndex === -1 ? Infinity : Number(process.argv[limitIndex + 1]);
const onlyIndex = process.argv.indexOf('--only');
const only = onlyIndex === -1 ? 'both' : (process.argv[onlyIndex + 1] as 'photo' | 'tour');

interface SiteRow {
  id: string;
  name: string;
  name_compact: string | null;
  diocese: string | null;
  location: string | null;
  lat: number | null;
  lng: number | null;
  tour_photo_id: string | null;
}

interface HubTourItem {
  contentId: string;
  contentTypeId: string;
  title: string;
  addr1: string | null;
  firstImage: string | null;
  xCoord: string | null;
  yCoord: string | null;
  cpyrhtDivCd?: string | null;
  cat3?: string | null;
}

interface HubPhotoItem {
  contentId: string;
  title: string;
  koFilmst: string | null;
  filmDay: string | null;
  koCmanNm: string | null;
  photoTag: string | null;
  tongPreImgUrl: string | null;
  tongOrgImgUrl: string | null;
  cpyrhtDivCd: string | null;
  orgCpyrhtNm: string | null;
}

interface Candidate {
  site: SiteRow;
  source: 'tourinfo' | 'photokorea';
  score: number;
  reason: string;
  /** tourinfo: TourAPI contentid · photokorea: 콘텐츠랩 식별자(TourAPI galContentId 가 아님) */
  contentId: string;
  title: string;
  imageUrl: string;
  location: string;
  photographer: string;
  license: string;
  tags: string;
  distanceKm: number | null;
}

/** 콘텐츠랩 시·도 코드 (2026-09-16 `hub/getArea.do` 실측). 광주·전남은 「전남광주통합특별시」 12 로 합쳐졌다. */
const AREA: Array<[RegExp, string, string]> = [
  [/^서울/, '11', '서울'],
  [/^(광주|전라남도|전남)/, '12', '광주·전남'],
  [/^부산/, '26', '부산'],
  [/^대구/, '27', '대구'],
  [/^인천/, '28', '인천'],
  [/^대전/, '30', '대전'],
  [/^울산/, '31', '울산'],
  [/^경기/, '41', '경기'],
  [/^(충청북도|충북)/, '43', '충북'],
  [/^(충청남도|충남)/, '44', '충남'],
  [/^(경상북도|경북)/, '47', '경북'],
  [/^(경상남도|경남)/, '48', '경남'],
  [/^제주/, '50', '제주'],
  [/^강원/, '51', '강원'],
  [/^(전라북도|전북)/, '52', '전북'],
  [/^세종/, '36110', '세종'],
];

function areaOf(text: string | null | undefined): { code: string; name: string } | null {
  if (!text) return null;
  const head = text.trim();
  for (const [re, code, name] of AREA) if (re.test(head)) return { code, name };
  return null;
}

/** 주소의 두 번째 토큰(시·군·구). "충청북도 진천군 백곡면 …" → "진천" */
function districtOf(text: string | null | undefined): string | null {
  if (!text) return null;
  const parts = text.trim().split(/\s+/);
  const second = parts[1] ?? '';
  const d = second.replace(/(특별자치시|특별자치도|광역시|특별시|시|군|구)$/, '');
  return d.length >= 2 ? d : null;
}

const RELIGIOUS = /성당|성지|천주교|순교|공소|수도원|가톨릭|카톨릭|성모|신부|추기경|순례|교우촌|십자가|피정|묵주|성인|복자|주교/;
const GENERIC =
  /(순교|성지|성당|기념|공소|순례지|순례길|성모|성가정|교우촌|박물관|기념관|현양|동산|순교자|순교지|묘소|묘|터|옥터|일원|복자|성|과|가족|유택지|고택지|주교좌|주교관|교육원|피정의|집|의|딸|공원|사랑과|나눔|관아|대도호부)/g;
/** 이름만으로는 장소를 못 짚는 낱말 — 세례명·직함·일반 지명. 단독으로 맞아도 점수를 주지 않는다. */
const STOP = new Set([
  '요한', '베드로', '바오로', '요셉', '마리아', '안토니오', '타대오', '알렉시오', '아우구스티노', '빅토리노',
  '신부', '주교', '성인', '성지', '성당', '기념', '공소', '한국', '천주교', '가톨릭', '순교', '순교자',
  '터', '묘', '옥', '관아', '병영', '장대', '읍성', '감영', '형조', '창립', '시성', '103위', '일만',
  '사랑', '나눔', '공원', '피정의', '겟세마니', '주교관', '교육원', '성가정', '순례길', '동산', '은총의',
]);

function compact(s: string): string {
  return s.replace(/\([^)]*\)/g, '').replace(/[\s·ㆍ‧,.'"()\-–—]/g, '');
}

/** 이름에서 고유 지명·인명 조각을 뽑는다. "갈매못 순교성지" → ["갈매못"], "성 남종삼 요한·…" → ["남종삼","남상교"] */
function properTokens(site: SiteRow): string[] {
  const raw = site.name.replace(/\s+/g, ' ').trim();
  const out = new Set<string>();
  const paren = /\(([^)]+)\)/.exec(raw);
  if (paren?.[1]) {
    for (const w of paren[1].split(/[\s·]+/)) {
      const t = w.replace(GENERIC, '').trim();
      if (t.length >= 2 && !STOP.has(t)) out.add(t);
    }
  }
  const base = raw.replace(/\([^)]*\)/g, '');
  for (const w of base.split(/[\s·]+/)) {
    const t = w.replace(GENERIC, '').replace(/[^가-힣0-9A-Za-z]/g, '').trim();
    if (t.length >= 2 && !STOP.has(t)) out.add(t);
  }
  return [...out];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let calls = 0;

async function hubPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await fetch(`${HUB}/${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        referer: `${HUB}/`,
        'user-agent': 'Mozilla/5.0 VisitHolyKorea-research (+https://github.com/linkcontent7-huisun/visitholykorea)',
      },
      body: JSON.stringify(body),
    });
    calls += 1;
    const text = await res.text();
    if (res.ok && text.trimStart().startsWith('[')) return JSON.parse(text) as T;
    if (res.ok && /^\d+$/.test(text.trim())) return Number(text) as unknown as T;
    // 잘못된 파라미터는 SPA 의 400 HTML 로 온다 — 다시 보내도 같으므로 한 번 더만 시도한다
    await sleep(1500 * (attempt + 1));
  }
  throw new Error(`콘텐츠랩 응답 없음: ${path} ${JSON.stringify(body).slice(0, 80)}`);
}

/** 콘텐츠랩 관광정보 검색(제목 부분 일치). 한 검색어의 전 페이지를 이어 받는다. */
async function searchTourInfo(title: string): Promise<HubTourItem[]> {
  const all: HubTourItem[] = [];
  for (let start = 0; start < 5000; start += PAGE) {
    const page = await hubPost<HubTourItem[]>('hub/getTourInfo.do', {
      langDiv: 'KOR',
      title,
      searchCnt: PAGE,
      searchStart: start,
    });
    all.push(...page);
    if (page.length < PAGE) break;
    await sleep(300);
  }
  return all;
}

/** 시·도의 관광사진 전체. 파일 캐시를 둔다 — 한 시·도가 수천 장이라 다시 받으면 몇 분씩 든다. */
async function photosOfArea(code: string, cacheDir: string): Promise<HubPhotoItem[]> {
  const cache = join(cacheDir, `hub_photos_${code}.json`);
  if (existsSync(cache)) return JSON.parse(readFileSync(cache, 'utf8')) as HubPhotoItem[];
  const total = await hubPost<number>('hub/getTourPhotoInfoTotalCnt.do', {
    langDiv: 'KOR',
    areaCd: [code],
    searchCnt: PAGE,
    searchStart: 0,
  });
  const all: HubPhotoItem[] = [];
  for (let start = 0; start < total; start += PAGE) {
    const page = await hubPost<HubPhotoItem[]>('hub/getTourPhotoInfo.do', {
      langDiv: 'KOR',
      areaCd: [code],
      searchCnt: PAGE,
      searchStart: start,
    });
    all.push(...page);
    process.stdout.write(`\r  사진 ${code}: ${all.length}/${total}   `);
    if (page.length === 0) break;
    await sleep(300);
  }
  process.stdout.write('\n');
  writeFileSync(cache, JSON.stringify(all));
  return all;
}

const ALLOWED_LICENSE = new Set(['Type1', 'Type3', '', null, undefined]);

function scoreTour(site: SiteRow, item: HubTourItem): Candidate | null {
  if (!item.firstImage) return null;
  if (!ALLOWED_LICENSE.has(item.cpyrhtDivCd ?? '')) return null;
  const siteC = compact(site.name_compact ?? site.name);
  const titleC = compact(item.title);
  const reasons: string[] = [];
  let score = 0;

  const religious = RELIGIOUS.test(item.title);
  const tokens = properTokens(site);
  if (titleC.includes(siteC)) { score += 5; reasons.push('제목=이름'); }
  else if (siteC.includes(titleC) && titleC.length >= 3) { score += 4; reasons.push('이름⊃제목'); }
  else {
    const hit = tokens.filter((t) => titleC.includes(compact(t)));
    if (hit.length > 0) { score += Math.min(4, 2 * hit.length); reasons.push(`조각(${hit.join('·')})`); }
  }
  if (religious) { score += 2; reasons.push('종교어'); }

  let distanceKm: number | null = null;
  const x = Number(item.xCoord);
  const y = Number(item.yCoord);
  if (site.lat != null && site.lng != null && Number.isFinite(x) && Number.isFinite(y) && x > 100 && y > 30) {
    distanceKm = haversineKm(site.lat, site.lng, y, x);
    if (distanceKm <= 0.5) { score += 4; reasons.push('500m 안'); }
    else if (distanceKm <= 2) { score += 2; reasons.push('2km 안'); }
    else if (distanceKm > 30) { score -= 6; reasons.push(`${Math.round(distanceKm)}km 떨어짐`); }
  } else {
    const sa = areaOf(site.location);
    const ia = areaOf(item.addr1);
    if (sa && ia && sa.code !== ia.code) { score -= 6; reasons.push(`다른 도(${ia.name})`); }
  }
  // 이름이 하나도 안 맞으면 종교 시설이 아주 가까울 때만 남긴다("서소문 밖 네거리" ↔ "서소문성지역사박물관")
  if (!reasons.some((r) => /제목|이름|조각/.test(r)) && !(religious && distanceKm != null && distanceKm <= 0.4)) return null;
  if (score < 4) return null;
  return {
    site,
    source: 'tourinfo',
    score,
    reason: reasons.join('·'),
    contentId: item.contentId,
    title: item.title,
    imageUrl: item.firstImage,
    location: item.addr1 ?? '',
    photographer: `TourAPI 관광정보(contentTypeId ${item.contentTypeId})`,
    license: item.cpyrhtDivCd ?? '',
    tags: item.cat3 ?? '',
    distanceKm,
  };
}

function scorePhoto(site: SiteRow, item: HubPhotoItem): Candidate | null {
  const image = item.tongPreImgUrl ?? item.tongOrgImgUrl;
  if (!image) return null;
  if (!ALLOWED_LICENSE.has(item.cpyrhtDivCd ?? '')) return null;
  const text = `${item.title} ${item.photoTag ?? ''}`;
  const textC = compact(text);
  const siteC = compact(site.name_compact ?? site.name);
  const reasons: string[] = [];
  let score = 0;

  const religious = RELIGIOUS.test(text);
  if (textC.includes(siteC)) { score += 5; reasons.push(compact(item.title).includes(siteC) ? '제목=이름' : '태그=이름'); }
  else {
    const hit = properTokens(site).filter((t) => textC.includes(compact(t)));
    if (hit.length === 0) return null;
    if (!religious) return null; // 지명 조각만 맞고 종교어가 없으면 그 동네 풍경 사진이다
    score += Math.min(4, 2 * hit.length);
    reasons.push(`조각(${hit.join('·')})`);
  }
  if (religious) { score += 2; reasons.push('종교어'); }

  const sd = districtOf(site.location);
  if (sd && (item.koFilmst ?? '').includes(sd)) { score += 2; reasons.push(`같은 시군(${sd})`); }
  if (score < 5) return null;
  return {
    site,
    source: 'photokorea',
    score,
    reason: reasons.join('·'),
    contentId: item.contentId,
    title: item.title,
    imageUrl: image,
    location: item.koFilmst ?? '',
    photographer: item.koCmanNm ?? '',
    license: item.cpyrhtDivCd ?? '',
    tags: item.photoTag ?? '',
    distanceKm: null,
  };
}

// ---------------------------------------------------------------------------

const db = await connectAdminDb();
const { rows: sites } = await db.query<SiteRow>(
  `select id, name, name_compact, diocese, location, lat, lng, tour_photo_id
     from public.holy_sites where image_url is null order by diocese, name`,
);
await db.end();

const targets = sites.filter((s) => !s.tour_photo_id).slice(0, limit);
console.log(`사진 없는 성지 ${sites.length}곳 중 관광공사 사진도 아직 없는 ${targets.length}곳 검색`);

const candidates: Candidate[] = [];
const errors: string[] = [];
const dir = join(ROOT, 'data', 'research');
const cacheDir = join(dir, '.hub-cache');
mkdirSync(cacheDir, { recursive: true });

if (only !== 'photo') {
  // 1) 종교 낱말로 전국을 훑는다 — 제목이 우리 이름과 다른 항목(「청양 다락골 줄무덤 성지」)도 좌표로 잡힌다
  const generic = ['성지', '성당', '천주교', '순교', '공소', '성모', '수도원', '순례', '가톨릭', '신부', '추기경', '교우촌', '피정'];
  const pool = new Map<string, HubTourItem>();
  for (const k of generic) {
    try {
      for (const it of await searchTourInfo(k)) pool.set(it.contentId, it);
    } catch (e) {
      errors.push(`관광정보 [${k}]: ${(e as Error).message}`);
    }
    await sleep(300);
  }
  console.log(`관광정보 종교 낱말 검색: ${pool.size}건`);
  // 2) 성지별 고유 조각으로도 친다 — 「강릉 대도호부 관아」처럼 종교어가 없는 이름을 위해
  for (const site of targets) {
    for (const t of properTokens(site).slice(0, 3)) {
      try {
        for (const it of await searchTourInfo(t)) pool.set(it.contentId, it);
      } catch (e) {
        errors.push(`관광정보 ${site.name} [${t}]: ${(e as Error).message}`);
      }
      await sleep(250);
    }
  }
  console.log(`관광정보 검색 합계: ${pool.size}건, 호출 ${calls}회`);
  for (const site of targets) {
    for (const it of pool.values()) {
      const c = scoreTour(site, it);
      if (c) candidates.push(c);
    }
  }
}

if (only !== 'tour') {
  const codes = new Map<string, SiteRow[]>();
  for (const site of targets) {
    const a = areaOf(site.location);
    if (!a) { errors.push(`시·도 판별 실패: ${site.name} (${site.location})`); continue; }
    codes.set(a.code, [...(codes.get(a.code) ?? []), site]);
  }
  for (const [code, group] of codes) {
    let photos: HubPhotoItem[];
    try {
      photos = await photosOfArea(code, cacheDir);
    } catch (e) {
      errors.push(`관광사진 시·도 ${code}: ${(e as Error).message}`);
      continue;
    }
    for (const site of group) {
      for (const p of photos) {
        const c = scorePhoto(site, p);
        if (c) candidates.push(c);
      }
    }
  }
}

candidates.sort((a, b) => a.site.name.localeCompare(b.site.name, 'ko') || b.score - a.score);
// 성지당 출처별 상위 10장 — 같은 곳 사진이 수십 장씩 나와 검토만 늘어난다
const perKey = new Map<string, number>();
const trimmed = candidates.filter((c) => {
  const k = `${c.site.id}:${c.source}`;
  const n = (perKey.get(k) ?? 0) + 1;
  perKey.set(k, n);
  return n <= 10;
});

const today = new Date().toISOString().slice(0, 10);
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const header = [
  'use', 'site_id', 'site_name', 'diocese', 'site_location', 'source', 'score', 'reason', 'distance_km',
  'content_id', 'title', 'image_url', 'location', 'photographer', 'license', 'tags',
];
const lines = [header.join(',')];
for (const c of trimmed) {
  lines.push(
    [
      '', c.site.id, c.site.name, c.site.diocese, c.site.location, c.source, c.score, c.reason,
      c.distanceKm == null ? '' : c.distanceKm.toFixed(2), c.contentId, c.title, c.imageUrl, c.location,
      c.photographer, c.license, c.tags,
    ].map(csvCell).join(','),
  );
}
const suffix = only === 'both' ? '' : `_${only}`;
const csvPath = join(dir, `tour_photo_sweep_${today}${suffix}.csv`);
writeFileSync(csvPath, '﻿' + lines.join('\n') + '\n');

const bySite = new Map<string, Candidate[]>();
for (const c of trimmed) bySite.set(c.site.id, [...(bySite.get(c.site.id) ?? []), c]);
const md: string[] = [
  `# 한국관광콘텐츠랩 사진 후보 — ${today}`,
  '',
  `- 검색 대상: 사진 없는 성지 ${targets.length}곳, 콘텐츠랩 호출 ${calls}회`,
  `- 후보가 1건 이상 나온 성지: **${bySite.size}곳**, 후보 ${trimmed.length}건`,
  `- 후보 CSV: \`data/research/${csvPath.split('/').pop()}\` — \`use\` 열에 y 를 적어 채택 표시`,
  '- 점수: 제목=이름 5 · 이름⊃제목 4 · 고유 조각 2/개(최대 4) · 종교어 +2 · 500m 안 +4 · 2km 안 +2 · 같은 시군 +2 · 30km 밖 −6',
  '',
  '| 성지 | 교구 | 후보 | 최고 후보 | 출처 | 점수 | 거리·촬영지 |',
  '| --- | --- | --- | --- | --- | --- | --- |',
];
for (const [, list] of bySite) {
  const best = list.reduce((a, b) => (b.score > a.score ? b : a));
  const where = best.distanceKm != null ? `${best.distanceKm.toFixed(1)}km · ${best.location}` : best.location;
  md.push(`| ${best.site.name} | ${best.site.diocese} | ${list.length} | ${best.title} | ${best.source} | ${best.score} | ${where} |`);
}
md.push('', '## 후보 없음', '');
for (const s of targets) if (!bySite.has(s.id)) md.push(`- ${s.diocese} ${s.name}`);
if (errors.length) md.push('', '## 오류', '', ...errors.map((e) => `- ${e}`));
const mdPath = join(dir, `tour_photo_sweep_${today}${suffix}.md`);
writeFileSync(mdPath, md.join('\n') + '\n');

console.log(`\n후보 있는 성지 ${bySite.size}/${targets.length}, 후보 ${trimmed.length}건, 호출 ${calls}회, 오류 ${errors.length}`);
console.log(csvPath);
console.log(mdPath);
