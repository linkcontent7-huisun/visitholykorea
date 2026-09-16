/**
 * TourAPI 동일 출처 중계의 핵심 — 런타임에 독립적인 순수 함수.
 *
 * 왜 이 파일이 있나 — 2026-09-14 실측에서 배포 번들 안에 공공데이터포털 서비스키가
 * 그대로 들어 있었다(`VITE_TOUR_API_SERVICE_KEY`). 키가 새면 제3자가 일일 한도를
 * 다 써 버려 붐빔 지수·주변 관광이 통째로 실패한다. 그래서 브라우저는 이 중계
 * (`/api/tour`)만 부르고, 키는 서버 환경 변수 `TOUR_API_SERVICE_KEY` 에만 둔다.
 *
 * 같은 로직을 두 곳에서 쓴다.
 *   - Vercel 서버리스 함수 `api/tour.ts` (운영)
 *   - Vite 개발 서버 미들웨어 (`vite.config.ts`, 로컬)
 * 그래서 Node `http` 객체를 직접 만지지 않고, 쿼리 → {status, headers, body} 로만 다룬다.
 *
 * 지키는 것
 *   1. 허용된 서비스·오퍼레이션·파라미터만 넘긴다 — 임의 URL 중계(SSRF·한도 소진) 차단
 *   2. 요청 시간 제한 — 공공데이터포털이 느릴 때 화면이 영원히 돌지 않게
 *   3. 429(한도)·상위 서버 장애·시간 초과·네트워크를 구분해 돌려준다
 *   4. 로그에 비밀값·전체 URL 을 남기지 않는다
 *   5. 응답을 저장하지 않는다(`Cache-Control: no-store`) — ADR 0002
 */

export const TOUR_API_ROOT = 'https://apis.data.go.kr/B551011';

/** 관광정보 계열(국문·외국어·무장애)은 오퍼레이션 이름이 같다. */
const TOUR_INFO_SERVICES = ['KorService2', 'EngService2', 'FreService2', 'SpnService2'] as const;

/**
 * 허용 오퍼레이션 표. 여기 없는 것은 400 으로 거절한다.
 * 파라미터도 이름 단위로 화이트리스트한다 — `serviceKey`·`_type` 같은 서버가 정하는 값을
 * 클라이언트가 덮어쓸 수 없게 하기 위해서다.
 */
export const ALLOWED_OPERATIONS: Record<
  string,
  { services: readonly string[]; params: readonly string[] }
> = {
  searchKeyword2: {
    services: TOUR_INFO_SERVICES,
    params: ['keyword', 'numOfRows', 'pageNo', 'arrange', 'contentTypeId', 'areaCode'],
  },
  locationBasedList2: {
    services: [...TOUR_INFO_SERVICES, 'KorWithService2'],
    params: ['mapX', 'mapY', 'radius', 'numOfRows', 'pageNo', 'arrange', 'contentTypeId'],
  },
  searchFestival2: {
    services: TOUR_INFO_SERVICES,
    params: [
      'eventStartDate',
      'eventEndDate',
      'mapX',
      'mapY',
      'radius',
      'numOfRows',
      'pageNo',
      'arrange',
      'areaCode',
    ],
  },
  areaBasedList2: {
    services: TOUR_INFO_SERVICES,
    params: ['areaCode', 'sigunguCode', 'contentTypeId', 'numOfRows', 'pageNo', 'arrange'],
  },
  /**
   * 관광정보 1건 상세 — 성지 대표 사진을 실시간으로 받는 데 쓴다.
   * DB 에는 contentid 만 있고(ADR 0002) 이미지 주소는 매번 여기서 온다.
   */
  detailCommon2: {
    services: TOUR_INFO_SERVICES,
    params: ['contentId'],
  },
  /**
   * 관광사진(포토코리아) 검색. id 로 직접 조회하는 오퍼레이션이 없어 제목으로 검색해
   * DB 에 적힌 galContentId 와 맞춘다. 사진은 공공누리 제1유형이다.
   */
  gallerySearchList1: {
    services: ['PhotoGalleryService1'],
    params: ['keyword', 'numOfRows', 'pageNo', 'arrange'],
  },
  /** 관광지 집중률(실측 방문자 추이) */
  tatsCnctrRatedList: {
    services: ['TatsCnctrRateService'],
    params: ['areaCd', 'signguCd', 'numOfRows', 'pageNo'],
  },
  /** 오디오 이야기(Odii) */
  storyLocationBasedList: {
    services: ['Odii'],
    params: ['mapX', 'mapY', 'radius', 'langCode', 'numOfRows', 'pageNo'],
  },
  /** 두루누비 걷기길 */
  courseList: {
    services: ['Durunubi'],
    params: ['brdDiv', 'numOfRows', 'pageNo'],
  },
};

/** 숫자만 허용하는 파라미터. 문자열이 섞여 들어오면 거절한다. */
const NUMERIC_PARAMS = new Set([
  'numOfRows',
  'pageNo',
  'contentTypeId',
  'radius',
  'areaCode',
  'sigunguCode',
  'areaCd',
  'signguCd',
  'contentId',
]);

/** 임의 텍스트 파라미터의 길이 상한. 검색어가 이보다 길 이유는 없다. */
const MAX_PARAM_LENGTH = 200;

export type TourProxyErrorKind =
  | 'bad_request'
  | 'not_configured'
  | 'rate_limited'
  | 'upstream'
  | 'timeout'
  | 'network';

export interface TourProxyResult {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface TourProxyOptions {
  serviceKey: string | undefined;
  /** 테스트에서 바꿔 끼우기 위해 주입한다. 기본은 전역 fetch. */
  fetchImpl?: typeof fetch;
  /** 상위 서버 응답 제한(ms). 화면 쪽 제한(10초)보다 짧아야 한다. */
  timeoutMs?: number;
  /** 로그 훅. 비밀값이 없는 요약만 받는다. */
  log?: (entry: Record<string, unknown>) => void;
}

const NO_STORE_HEADERS: Record<string, string> = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function errorResult(status: number, kind: TourProxyErrorKind, extra: Record<string, unknown> = {}): TourProxyResult {
  return {
    status,
    headers: NO_STORE_HEADERS,
    body: JSON.stringify({ error: { kind, ...extra } }),
  };
}

/**
 * 쿼리를 검사해 상위 요청 URL 을 만든다. 실패하면 사유를 돌려준다.
 * 순수 함수라 테스트에서 URL 생성만 따로 검증할 수 있다.
 */
export function buildUpstreamUrl(
  query: URLSearchParams,
  serviceKey: string,
): { ok: true; url: URL; op: string; service: string } | { ok: false; reason: string } {
  const op = query.get('op') ?? '';
  const service = query.get('service') ?? 'KorService2';
  const rule = ALLOWED_OPERATIONS[op];
  if (!rule) return { ok: false, reason: '허용되지 않은 오퍼레이션' };
  if (!rule.services.includes(service)) return { ok: false, reason: '허용되지 않은 서비스' };

  const url = new URL(`${TOUR_API_ROOT}/${service}/${op}`);
  // 서버가 정하는 값 — 클라이언트가 보낸 같은 이름의 값은 무시된다.
  url.searchParams.set('serviceKey', serviceKey);
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'VisitHolyKorea');
  url.searchParams.set('_type', 'json');

  for (const name of rule.params) {
    const value = query.get(name);
    if (value == null || value === '') continue;
    if (value.length > MAX_PARAM_LENGTH) return { ok: false, reason: `${name} 이 너무 깁니다` };
    // 제어 문자는 어떤 파라미터에도 들어갈 이유가 없다.
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(value)) {
      return { ok: false, reason: `${name} 값이 올바르지 않습니다` };
    }
    if (NUMERIC_PARAMS.has(name) && !/^\d{1,10}$/.test(value)) {
      return { ok: false, reason: `${name} 은 숫자여야 합니다` };
    }
    url.searchParams.set(name, value);
  }

  return { ok: true, url, op, service };
}

/**
 * 중계 본체. GET 만 받는다.
 * 상위 응답은 상태와 본문을 그대로 넘기되, 429·5xx·시간 초과·네트워크는 종류를 붙여 돌려준다.
 */
export async function handleTourProxy(
  query: URLSearchParams,
  options: TourProxyOptions,
): Promise<TourProxyResult> {
  const { serviceKey, fetchImpl = fetch, timeoutMs = 8000, log = () => {} } = options;

  if (!serviceKey) {
    log({ op: query.get('op'), kind: 'not_configured' });
    return errorResult(503, 'not_configured');
  }

  const built = buildUpstreamUrl(query, serviceKey);
  if (!built.ok) {
    log({ op: query.get('op'), kind: 'bad_request', reason: built.reason });
    return errorResult(400, 'bad_request', { reason: built.reason });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const res = await fetchImpl(built.url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    const body = await res.text();
    const elapsedMs = Date.now() - startedAt;

    if (res.status === 429) {
      log({ op: built.op, service: built.service, status: 429, kind: 'rate_limited', elapsedMs });
      return errorResult(429, 'rate_limited');
    }
    if (res.status >= 500) {
      log({ op: built.op, service: built.service, status: res.status, kind: 'upstream', elapsedMs });
      return errorResult(502, 'upstream', { status: res.status });
    }
    if (!res.ok) {
      // 4xx(403 미승인 서비스 등)는 클라이언트가 원인을 알아야 하므로 상태를 보존한다.
      log({ op: built.op, service: built.service, status: res.status, kind: 'upstream', elapsedMs });
      return errorResult(res.status, 'upstream', { status: res.status });
    }

    return {
      status: 200,
      headers: {
        'content-type': res.headers.get('content-type') ?? 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
      body,
    };
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const aborted = error instanceof Error && error.name === 'AbortError';
    const kind: TourProxyErrorKind = aborted ? 'timeout' : 'network';
    // 오류 객체에는 상위 URL(= 키 포함)이 들어 있을 수 있어 메시지를 통째로 남기지 않는다.
    log({ op: built.op, service: built.service, kind, elapsedMs });
    return errorResult(aborted ? 504 : 502, kind);
  } finally {
    clearTimeout(timer);
  }
}
