/**
 * 포토코리아(한국관광공사 관광사진) 에서 사진 없는 성지의 사진 후보를 찾는다.
 *
 *   npm run photos:search            → data/research/photokorea_candidates_<날짜>.csv + 요약 md
 *   npm run photos:search -- --limit 20   (시험용: 앞 20곳만)
 *
 * 왜 후보만 뽑고 DB 에 쓰지 않는가 —
 *   1) 검색 결과가 그 성지를 찍은 사진인지는 사람이 봐야 안다("해미" → 김해미술관 같은 오검색이 많다).
 *   2) ADR 0002: 관광공사 주소(tong.visitkorea.or.kr)를 DB 에 저장하는 것은 TourAPI 응답 저장으로
 *      읽힐 수 있다. 채택한 사진은 공공누리 제1유형 저작물로 내려받아 우리 저장소에 올리고
 *      출처(포토코리아·사진가)를 적는 별도 단계로 처리한다.
 *
 * API: PhotoGalleryService1/gallerySearchList1 (keyword 는 제목·검색어 부분 일치).
 * 응답에는 라이선스 필드가 없으므로 채택 전 포토코리아 페이지에서 공공누리 유형을 확인한다.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnvLocal, ROOT } from './lib/env.ts';
import { connectAdminDb } from './lib/db.ts';

loadEnvLocal();

const serviceKey = process.env.TOUR_API_SERVICE_KEY;
if (!serviceKey) {
  console.error('TOUR_API_SERVICE_KEY 가 .env.local 에 없습니다.');
  process.exit(1);
}

const limitIndex = process.argv.indexOf('--limit');
const limit = limitIndex === -1 ? Infinity : Number(process.argv[limitIndex + 1]);

interface SiteRow {
  id: string;
  name: string;
  name_compact: string | null;
  diocese: string | null;
  location: string | null;
  category: string | null;
}

interface GalleryItem {
  galContentId: string;
  galTitle: string;
  galWebImageUrl: string;
  galPhotographyLocation?: string;
  galPhotographer?: string;
  galPhotographyMonth?: string;
  galSearchKeyword?: string;
}

interface Candidate {
  site: SiteRow;
  keyword: string;
  item: GalleryItem;
  score: number;
  reason: string;
}

/** 성지 이름에서 검색어를 뽑는다. 짧은 고유 지명이 가장 잘 통한다("갈매못", "배론"). */
function keywordsFor(site: SiteRow): string[] {
  const raw = site.name.replace(/\s+/g, ' ').trim();
  const out = new Set<string>();

  // 괄호 안 별칭 — "곡성 옥터 성지(곡성성당)" → "곡성성당"
  const paren = /\(([^)]+)\)/.exec(raw);
  if (paren) out.add(paren[1].replace(/\s+/g, ''));
  const base = raw.replace(/\([^)]*\)/g, '').trim();

  // 이름 전체(공백 제거) — "배론 성지" → "배론성지"
  out.add(base.replace(/\s+/g, ''));

  // 일반어 제거한 고유 부분 — "갈매못 순교성지" → "갈매못", "나주 순교자 기념성당" → "나주"
  const generic =
    /(순교|성지|성당|기념|공소|순례지|순례길|성모|성가정|교우촌|박물관|기념관|현양|동산|순교자|순교지|묘소|묘|터|옥터|일원|복자|성|과|가족|유택지|고택지|주교좌|주교관|교육원|피정의|집|의|딸)/g;
  const proper = base
    .split(' ')
    .map((w) => w.replace(generic, '').trim())
    .filter((w) => w.length >= 2);
  for (const w of proper) out.add(w);
  if (proper.length >= 2) out.add(proper.slice(0, 2).join(' '));

  return [...out].filter((k) => k.length >= 2);
}

/** 도 이름을 짧게 통일한다 — "충청남도"·"충남" 모두 "충남". */
function provinceOf(text: string | null | undefined): string | null {
  if (!text) return null;
  const map: Array<[RegExp, string]> = [
    [/^서울/, '서울'], [/^부산/, '부산'], [/^대구/, '대구'], [/^인천/, '인천'], [/^광주/, '광주'],
    [/^대전/, '대전'], [/^울산/, '울산'], [/^세종/, '세종'], [/^경기/, '경기'], [/^강원/, '강원'],
    [/^충청북도|^충북/, '충북'], [/^충청남도|^충남/, '충남'], [/^전라북도|^전북/, '전북'],
    [/^전라남도|^전남/, '전남'], [/^경상북도|^경북/, '경북'], [/^경상남도|^경남/, '경남'], [/^제주/, '제주'],
  ];
  const head = text.trim();
  for (const [re, name] of map) if (re.test(head)) return name;
  return null;
}

const RELIGIOUS = /성당|성지|천주교|순교|공소|수도원|가톨릭|카톨릭|성모|신부|추기경|순례/;

function scoreItem(site: SiteRow, keyword: string, item: GalleryItem): { score: number; reason: string } | null {
  const title = item.galTitle ?? '';
  const tags = item.galSearchKeyword ?? '';
  const text = `${title} ${tags}`;
  const compact = (site.name_compact ?? site.name).replace(/\([^)]*\)/g, '');
  const reasons: string[] = [];
  let score = 0;

  const religious = RELIGIOUS.test(text);
  if (title.replace(/\s+/g, '').includes(compact)) { score += 5; reasons.push('제목=이름'); }
  else if (text.replace(/\s+/g, '').includes(compact)) { score += 3; reasons.push('검색어=이름'); }
  // 이름 전체가 아니라 지명 조각만 맞을 때는 종교어가 같이 있어야 후보로 본다
  // ("목포" 만으로는 목포 시내 사진 전부가 걸린다 — 9/15 시험에서 확인)
  else if (religious && title.includes(keyword)) { score += 2; reasons.push('제목⊃검색어'); }
  else if (religious && tags.includes(keyword)) { score += 1; reasons.push('검색어⊃검색어'); }
  else return null;

  if (religious) { score += 2; reasons.push('종교어'); }

  const sp = provinceOf(site.location);
  const ip = provinceOf(item.galPhotographyLocation);
  if (sp && ip) {
    if (sp === ip) { score += 2; reasons.push('같은 도'); }
    else { score -= 3; reasons.push(`다른 도(${ip})`); }
  }
  // 종교어도 없고 제목도 이름이 아니면 우연한 부분 일치일 가능성이 높다 ("해미"→"김해미술관")
  if (score < 3) return null;
  return { score, reason: reasons.join('·') };
}

async function search(keyword: string): Promise<GalleryItem[]> {
  const q = new URLSearchParams({
    serviceKey: serviceKey!,
    numOfRows: '40',
    pageNo: '1',
    MobileOS: 'ETC',
    MobileApp: 'VisitHolyKorea',
    arrange: 'A',
    _type: 'json',
    keyword,
  });
  const res = await fetch(`https://apis.data.go.kr/B551011/PhotoGalleryService1/gallerySearchList1?${q}`);
  const text = await res.text();
  let data: { response?: { header?: { resultCode?: string; resultMsg?: string }; body?: { items?: { item?: GalleryItem[] } | '' } } };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`JSON 아님(한도 초과·서버 오류 가능): ${text.slice(0, 120)}`);
  }
  const header = data.response?.header;
  if (header?.resultCode && header.resultCode !== '0000') throw new Error(`${header.resultCode} ${header.resultMsg}`);
  const items = data.response?.body?.items;
  return items && typeof items === 'object' ? (items.item ?? []) : [];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const csvCell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const db = await connectAdminDb();
const { rows: sites } = await db.query<SiteRow>(
  `select id, name, name_compact, diocese, location, category
     from public.holy_sites where image_url is null order by diocese, name`,
);
await db.end();

const targets = sites.slice(0, limit);
console.log(`사진 없는 성지 ${sites.length}곳 중 ${targets.length}곳 검색`);

const candidates: Candidate[] = [];
const errors: string[] = [];
let calls = 0;

for (const site of targets) {
  const seen = new Set<string>();
  for (const keyword of keywordsFor(site)) {
    let items: GalleryItem[];
    try {
      items = await search(keyword);
      calls += 1;
    } catch (e) {
      errors.push(`${site.name} [${keyword}]: ${(e as Error).message}`);
      await sleep(1000);
      continue;
    }
    for (const item of items) {
      if (seen.has(item.galContentId)) continue;
      const scored = scoreItem(site, keyword, item);
      if (!scored) continue;
      seen.add(item.galContentId);
      candidates.push({ site, keyword, item, ...scored });
    }
    await sleep(250);
  }
  const n = candidates.filter((c) => c.site.id === site.id).length;
  console.log(`${n > 0 ? '○' : '·'} ${site.diocese} ${site.name} — 후보 ${n}`);
}

candidates.sort((a, b) => a.site.name.localeCompare(b.site.name, 'ko') || b.score - a.score);
// 성지당 상위 12장만 남긴다 — 같은 곳을 찍은 사진이 수십 장씩 나와 검토 부담만 는다
const perSite = new Map<string, number>();
const trimmed = candidates.filter((c) => {
  const n = (perSite.get(c.site.id) ?? 0) + 1;
  perSite.set(c.site.id, n);
  return n <= 12;
});
candidates.length = 0;
candidates.push(...trimmed);

const today = new Date().toISOString().slice(0, 10);
const dir = join(ROOT, 'data', 'research');
mkdirSync(dir, { recursive: true });

const header = [
  'use', 'site_id', 'site_name', 'diocese', 'site_location', 'keyword', 'score', 'reason',
  'gal_content_id', 'gal_title', 'gal_image_url', 'gal_location', 'gal_photographer', 'gal_month', 'gal_keywords',
];
const lines = [header.join(',')];
for (const c of candidates) {
  lines.push(
    [
      '', c.site.id, c.site.name, c.site.diocese, c.site.location, c.keyword, c.score, c.reason,
      c.item.galContentId, c.item.galTitle, c.item.galWebImageUrl, c.item.galPhotographyLocation,
      c.item.galPhotographer, c.item.galPhotographyMonth, c.item.galSearchKeyword,
    ].map(csvCell).join(','),
  );
}
const csvPath = join(dir, `photokorea_candidates_${today}.csv`);
writeFileSync(csvPath, '﻿' + lines.join('\n') + '\n');

const withCandidates = new Map<string, Candidate[]>();
for (const c of candidates) {
  const list = withCandidates.get(c.site.id) ?? [];
  list.push(c);
  withCandidates.set(c.site.id, list);
}
const md: string[] = [
  `# 포토코리아 사진 후보 — ${today}`,
  '',
  `- 검색 대상: 사진 없는 성지 ${targets.length}곳 (전체 ${sites.length}곳), API 호출 ${calls}회`,
  `- 후보가 1건 이상 나온 성지: **${withCandidates.size}곳**, 후보 사진 ${candidates.length}장`,
  `- 후보 CSV: \`data/research/${csvPath.split('/').pop()}\` — \`use\` 열에 y 를 적어 채택 표시`,
  '- 점수: 제목=이름 5 · 검색어=이름 3 · 종교어 +2 · 같은 도 +2 · 다른 도 −3. 3점 미만은 버림',
  '',
  '| 성지 | 교구 | 후보 | 최고 후보 제목 | 점수 | 촬영지 |',
  '| --- | --- | --- | --- | --- | --- |',
];
for (const [, list] of withCandidates) {
  const best = list.reduce((a, b) => (b.score > a.score ? b : a));
  md.push(
    `| ${best.site.name} | ${best.site.diocese} | ${list.length} | ${best.item.galTitle} | ${best.score} | ${best.item.galPhotographyLocation ?? ''} |`,
  );
}
md.push('', '## 후보 없음', '');
for (const s of targets) if (!withCandidates.has(s.id)) md.push(`- ${s.diocese} ${s.name}`);
if (errors.length) md.push('', '## 오류', '', ...errors.map((e) => `- ${e}`));
const mdPath = join(dir, `photokorea_summary_${today}.md`);
writeFileSync(mdPath, md.join('\n') + '\n');

console.log(`\n후보 있는 성지 ${withCandidates.size}/${targets.length}, 후보 ${candidates.length}장, 호출 ${calls}회, 오류 ${errors.length}`);
console.log(csvPath);
console.log(mdPath);
