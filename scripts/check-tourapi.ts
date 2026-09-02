/**
 * TourAPI 실호출 점검 (로컬 전용).
 *
 * 웹 세션은 data.go.kr 이 막혀 있어 API 응답을 볼 수 없다. 그래서 새 서비스를
 * 붙일 때마다 "경로가 맞는지"를 로컬에서 한 번 확인해야 한다.
 *
 *   npm run tourapi:check
 *
 * 확인하는 것:
 *   1) 기존 KorService2 — 지금도 정상인가 (한도 초과·키 만료 조기 감지)
 *   2) KorWithService2 무장애 여행 정보 — **경로가 실재하는가** (2026-09-02 미검증)
 *
 * 2번이 실패하면 앱은 그 섹션을 아예 그리지 않으므로 화면은 멀쩡하다.
 * 실패가 확인되면 `src/shared/api/tour-api.ts` 의 무장애 함수를 지우거나
 * 올바른 경로로 고친다.
 */

import { loadEnvLocal } from './lib/env';

loadEnvLocal({ supabasePlaceholder: true });

const KEY = process.env.VITE_TOUR_API_SERVICE_KEY;
const MOBILE_APP = 'VisitHolyKorea';

/** 절두산 순교성지 좌표 — 서울 도심이라 주변 데이터가 가장 풍부하다. */
const TEST_POINT = { mapX: 126.9316, mapY: 37.5486 };

interface Header {
  resultCode?: string;
  resultMsg?: string;
}

async function call(baseUrl: string, endpoint: string, params: Record<string, string | number>) {
  const query = new URLSearchParams({
    serviceKey: KEY!,
    MobileOS: 'ETC',
    MobileApp: MOBILE_APP,
    _type: 'json',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const url = `${baseUrl}/${endpoint}?${query}`;
  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    return { ok: false as const, detail: `HTTP ${res.status}`, raw: text.slice(0, 200) };
  }

  try {
    const json = JSON.parse(text) as {
      response?: { header?: Header; body?: { items?: { item?: unknown }; totalCount?: number } };
    };
    const header = json.response?.header;
    if (header?.resultCode !== '0000') {
      return {
        ok: false as const,
        detail: `resultCode ${header?.resultCode} — ${header?.resultMsg}`,
        raw: '',
      };
    }
    const item = json.response?.body?.items?.item;
    const count = Array.isArray(item) ? item.length : item ? 1 : 0;
    return { ok: true as const, detail: `${count}건 (전체 ${json.response?.body?.totalCount ?? '?'})`, raw: '' };
  } catch {
    // XML 오류 응답이 오는 경우가 많다 — 경로 자체가 없을 때의 전형적인 신호다.
    return { ok: false as const, detail: 'JSON 이 아닌 응답', raw: text.slice(0, 200) };
  }
}

async function main() {
  if (!KEY) {
    console.error('VITE_TOUR_API_SERVICE_KEY 가 .env.local 에 없습니다.');
    process.exit(1);
  }

  const checks = [
    {
      label: '① KorService2 위치기반 (기존 기능)',
      baseUrl: 'https://apis.data.go.kr/B551011/KorService2',
      endpoint: 'locationBasedList2',
      params: { ...TEST_POINT, radius: 3000, numOfRows: 3, pageNo: 1, arrange: 'E' },
      required: true,
    },
    {
      label: '② KorWithService2 무장애 여행 (신규·미검증)',
      baseUrl: 'https://apis.data.go.kr/B551011/KorWithService2',
      endpoint: 'locationBasedList2',
      params: { ...TEST_POINT, radius: 5000, numOfRows: 3, pageNo: 1, arrange: 'E' },
      required: false,
    },
  ];

  let requiredFailed = false;

  for (const c of checks) {
    const result = await call(c.baseUrl, c.endpoint, c.params);
    console.log(`\n${result.ok ? '✅' : '❌'} ${c.label}`);
    console.log(`   ${c.baseUrl}/${c.endpoint}`);
    console.log(`   ${result.detail}`);
    if (result.raw) console.log(`   응답 일부: ${result.raw.replace(/\s+/g, ' ')}`);

    if (!result.ok && c.required) requiredFailed = true;
    if (!result.ok && !c.required) {
      console.log('   → 이 경로는 앱에서 실패해도 섹션이 조용히 접힙니다.');
      console.log('     계속 실패하면 tour-api.ts 의 무장애 함수를 정리하세요.');
    }
  }

  console.log('');
  process.exit(requiredFailed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
