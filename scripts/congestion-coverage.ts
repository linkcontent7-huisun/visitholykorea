/**
 * 관광공사 「관광지 집중률 예측」(TatsCnctrRateService) 에 우리 성지가 몇 곳이나
 * 관광지 이름으로 올라 있는지 재는 도구. 추측하지 않고 실제 호출해서 센다.
 *
 *   npm run congestion:coverage
 *
 * 흐름: DB 성지 주소 → 법정동 시·도/시군구 코드(TourAPI ldongCode2) → 시군구별 집중률
 * 전체 페이지 → 성지명과 대조. 결과는 화면에만 찍는다 (TourAPI 응답 저장 금지 — ADR 0002).
 * 호출 수는 시군구 수 × 페이지 수(300행/페이지) 라 하루 한도(개발 계정 1,000) 안에서 돈다.
 */
import { loadEnvLocal } from './lib/env.ts';
import { createAdminClient } from './lib/admin.ts';

loadEnvLocal();
const key = process.env.TOUR_API_SERVICE_KEY;
if (!key) {
  console.error('TOUR_API_SERVICE_KEY 가 없습니다. .env.local 을 확인하세요.');
  process.exit(1);
}

const BASE = 'https://apis.data.go.kr/B551011';
let calls = 0;

async function tour<T>(
  service: string,
  op: string,
  params: Record<string, string | number>,
): Promise<{ total: number; items: T[] }> {
  const q = new URLSearchParams({
    serviceKey: key!,
    MobileOS: 'ETC',
    MobileApp: 'vhk',
    _type: 'json',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  calls += 1;
  const res = await fetch(`${BASE}/${service}/${op}?${q}`);
  const text = await res.text();
  let json: {
    response?: {
      header?: { resultMsg?: string };
      body?: { totalCount?: number; items?: { item?: T[] } };
    };
  };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${op} 비JSON 응답 (한도 초과?): ${text.slice(0, 120)}`);
  }
  const body = json.response?.body;
  return { total: body?.totalCount ?? 0, items: body?.items?.item ?? [] };
}

// 1. 법정동 코드표 — 시·도, 시군구
interface LdongCode {
  code: string;
  name: string;
}
const sido = (await tour<LdongCode>('KorService2', 'ldongCode2', { numOfRows: 50, pageNo: 1 }))
  .items;
const signguBySido = new Map<string, LdongCode[]>();
for (const s of sido) {
  const list = (
    await tour<LdongCode>('KorService2', 'ldongCode2', {
      numOfRows: 100,
      pageNo: 1,
      lDongRegnCd: s.code,
    })
  ).items;
  signguBySido.set(s.code, list);
}

/** "서울특별시"→"서울", "충청남도"→"충남" 처럼 주소에서 시·도를 찾기 위한 짧은 이름 */
function shortSido(name: string): string[] {
  const m: Record<string, string[]> = {
    서울특별시: ['서울'],
    부산광역시: ['부산'],
    대구광역시: ['대구'],
    인천광역시: ['인천'],
    광주광역시: ['광주'],
    대전광역시: ['대전'],
    울산광역시: ['울산'],
    세종특별자치시: ['세종'],
    경기도: ['경기'],
    강원특별자치도: ['강원'],
    충청북도: ['충북', '충청북도'],
    충청남도: ['충남', '충청남도'],
    전북특별자치도: ['전북', '전라북도'],
    // 2026 행정구역 개편으로 광주·전남이 합쳐졌다. 성지 주소는 아직 옛 이름이다.
    전남광주통합특별시: ['전남', '전라남도', '광주'],
    경상북도: ['경북', '경상북도'],
    경상남도: ['경남', '경상남도'],
    제주특별자치도: ['제주'],
  };
  return [name, ...(m[name] ?? [])];
}

// 2. 성지 → 시군구 코드
const supabase = createAdminClient();
const { data: sites, error } = await supabase
  .from('holy_sites')
  .select('id, name, location')
  .order('name');
if (error || !sites) {
  console.error('성지 조회 실패:', error?.message);
  process.exit(1);
}

/**
 * 개편 전 시군구 코드. 인천 중구·동구는 2026 개편으로 제물포구·영종구가 됐지만
 * 집중률 API 는 아직 옛 코드(28110·28140)로만 데이터를 준다 (2026-09-15 실측).
 */
const LEGACY_SIGNGU: Record<string, { areaCd: string; signguCd: string; signguNm: string }> = {
  '인천광역시 중구': { areaCd: '28', signguCd: '28110', signguNm: '인천광역시 중구(옛 코드)' },
  '인천광역시 동구': { areaCd: '28', signguCd: '28140', signguNm: '인천광역시 동구(옛 코드)' },
  '인천시 동구': { areaCd: '28', signguCd: '28140', signguNm: '인천광역시 동구(옛 코드)' },
};

interface Located {
  name: string;
  address: string | null;
  areaCd: string;
  signguCd: string;
  signguNm: string;
}
const located: Located[] = [];
const unlocated: { name: string; address: string | null }[] = [];
for (const site of sites) {
  const addr = site.location ?? '';
  const legacy = Object.entries(LEGACY_SIGNGU).find(([prefix]) => addr.startsWith(prefix))?.[1];
  if (legacy) {
    located.push({ name: site.name, address: site.location, ...legacy });
    continue;
  }
  const s = sido.find((x) => shortSido(x.name).some((n) => addr.startsWith(n)));
  const list = s ? (signguBySido.get(s.code) ?? []) : [];
  // "천안시 동남구" 처럼 긴 이름을 먼저 맞춘다
  const g = [...list]
    .sort((a, b) => b.name.length - a.name.length)
    .find((x) => addr.includes(x.name));
  if (s && g)
    located.push({
      name: site.name,
      address: site.location,
      areaCd: s.code,
      signguCd: s.code + g.code,
      signguNm: `${s.name} ${g.name}`,
    });
  else unlocated.push({ name: site.name, address: site.location });
}

// 3. 시군구별 집중률 관광지 이름 (전체 페이지)
interface Rate {
  tAtsNm: string;
  baseYmd: string;
  cnctrRate: string;
}
const namesBySigngu = new Map<string, Set<string>>();
const uniqueSigngu = [...new Map(located.map((l) => [l.signguCd, l])).values()];
for (const { areaCd, signguCd } of uniqueSigngu) {
  const names = new Set<string>();
  for (let pageNo = 1; pageNo <= 40; pageNo += 1) {
    const { total, items } = await tour<Rate>('TatsCnctrRateService', 'tatsCnctrRatedList', {
      areaCd,
      signguCd,
      numOfRows: 300,
      pageNo,
    });
    for (const it of items) names.add(it.tAtsNm);
    if (items.length === 0 || pageNo * 300 >= total) break;
  }
  namesBySigngu.set(signguCd, names);
}

// 4. 이름 대조 — 공백·괄호 제거 뒤 정확히 같거나 한쪽이 다른 쪽을 포함
const norm = (s: string) => s.replace(/\s|\(.*?\)/g, '');
const matched: { site: string; spot: string; signgu: string }[] = [];
const unmatched: Located[] = [];
for (const l of located) {
  const names = [...(namesBySigngu.get(l.signguCd) ?? [])];
  const a = norm(l.name);
  const hit =
    names.find((n) => norm(n) === a) ??
    names.find((n) => {
      const b = norm(n);
      return b.length >= 3 && (a.includes(b) || b.includes(a));
    });
  if (hit) matched.push({ site: l.name, spot: hit, signgu: l.signguNm });
  else unmatched.push(l);
}

console.log(
  `\n성지 ${sites.length}곳 / 시군구 식별 ${located.length} / 주소로 시군구 못 찾음 ${unlocated.length} / 시군구 ${uniqueSigngu.length}개 / 호출 ${calls}회\n`,
);
console.log(`▶ 집중률 관광지로 올라 있는 성지: ${matched.length}곳`);
for (const m of matched)
  console.log(`  ${m.site}${m.site === m.spot ? '' : `  ← "${m.spot}"`}  (${m.signgu})`);
console.log(
  `\n▶ 같은 시군구에 관광지 데이터는 있지만 성지 이름은 없음: ${unmatched.filter((u) => (namesBySigngu.get(u.signguCd)?.size ?? 0) > 0).length}곳`,
);
console.log(
  `▶ 시군구 자체에 집중률 데이터 없음: ${unmatched.filter((u) => (namesBySigngu.get(u.signguCd)?.size ?? 0) === 0).length}곳`,
);
if (unlocated.length) {
  console.log(`\n▶ 주소로 시군구를 못 찾은 성지 ${unlocated.length}곳:`);
  for (const u of unlocated) console.log(`  ${u.name}  (${u.address ?? '주소 없음'})`);
}
