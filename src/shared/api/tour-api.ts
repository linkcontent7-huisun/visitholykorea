/**
 * 한국관광공사 TourAPI 실시간 호출 클라이언트.
 *
 * 공모전 규정: OpenAPI 응답을 로컬 DB에 캐싱해 재사용하면 안 되고 매 요청마다
 * 실시간으로 호출해야 한다. 따라서 이 모듈은 DB·localStorage·서비스워커 어디에도
 * 결과를 저장하지 않는다(vite.config.ts 의 runtimeCaching 에 이 URL 이 없는 것이 의도).
 * 화면이 쓰는 TanStack Query 메모리 캐시(최대 1시간)와 두루누비 목록의 세션 메모리는
 * 새로고침하면 사라지는 값이다.
 *
 * **브라우저는 공공데이터포털을 직접 부르지 않는다.** 같은 출처의 `/api/tour`
 * (Vercel 서버리스 · Vite 미들웨어, `api/_lib/tour-proxy-core.ts`)가 서비스키를 붙여
 * 중계한다 — 2026-09-14 실측에서 키가 번들에 노출됐던 것을 막는 구조다.
 * `scripts/` 의 Node 도구만 `TOUR_API_SERVICE_KEY` 로 직접 호출한다.
 */

import { env } from '@/shared/config/env';
import { createConcurrencyGate } from '@/shared/lib/concurrency-gate';
import type { Language } from '@/shared/i18n/dictionary';

const TOUR_API_ROOT = 'https://apis.data.go.kr/B551011';
/** 기본 서비스(국문 관광정보). 다른 서비스는 이름으로 지정한다. */
const DEFAULT_SERVICE = 'KorService2';
/**
 * 무장애 여행 정보 서비스.
 *
 * **경로는 확인됐다** — 2026-09-02 로컬 실호출에서 404 가 아니라
 * `403 등록되지 않은 서비스키`가 왔다. 즉 서비스는 실재하고, 우리 키가 아직
 * 그 서비스에 활용신청되지 않았을 뿐이다.
 *
 * 🔴 **남은 일**: data.go.kr 에서 무장애 여행정보 서비스에 활용신청 →
 * 승인(보통 몇 시간~1일) 후 자동으로 화면에 나타난다. 승인 전까지는 403 이
 * 빈 배열로 흡수되어 섹션이 조용히 접히므로 사용자에게 오류가 보이지 않는다.
 */
const BARRIER_FREE_SERVICE = 'KorWithService2';
const MOBILE_APP = 'VisitHolyKorea';
/** 브라우저 쪽 요청 제한. 중계(8초)보다 조금 길게 잡아 중계의 분류된 오류를 먼저 받는다. */
const REQUEST_TIMEOUT_MS = 10_000;

/** TourAPI 콘텐츠 타입 코드 (자주 쓰는 것만) */
export const CONTENT_TYPE = {
  관광지: 12,
  문화시설: 14,
  여행코스: 25,
  레포츠: 28,
  숙박: 32,
  쇼핑: 38,
  음식점: 39,
} as const;

export interface TourApiSpot {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2: string;
  mapx: string;
  mapy: string;
  firstimage: string;
  /** 좌표 기준 조회에서만 채워지는 거리(m) */
  dist?: string;
}

/**
 * 관광지 집중률 — 일반 관광지 응답과 필드가 다르다. **좌표 필드는 없다**(2026-09-15 실측).
 * 응답은 오늘부터 30일치가 한 번에 온다(`baseYmd` 로 구분).
 */
export interface CongestionRate {
  baseYmd: string;
  areaCd: string;
  areaNm: string;
  signguCd: string;
  signguNm: string;
  tAtsNm: string;
  cnctrRate: string;
}

/** 법정동 코드표(`ldongCode2`) 한 행. 시·도 목록이면 2자리, 시·군·구 목록이면 3자리 코드. */
export interface LdongCode {
  code: string;
  name: string;
}

export interface RelatedSpot {
  rlteTatsNm?: string;
  tatsNm?: string;
  title?: string;
  mapX?: string;
  mapY?: string;
}

export interface HubSpot {
  hubTatsNm: string;
  hubCtgryLclsNm: string;
  hubRank: string;
  mapX: string;
  mapY: string;
}

/** Odii storyLocationBasedList 실제 응답 필드 (2026-09-14 실측: title·audioTitle·script·audioUrl·playTime·imageUrl) */
export interface AudioStory {
  title?: string;
  audioTitle?: string;
  script?: string;
  audioUrl?: string;
  playTime?: string;
  imageUrl?: string;
}

/** 두루누비 courseList 실제 응답 필드 (2026-09-14 실측) */
export interface WalkingCourse {
  crsIdx?: string;
  crsKorNm?: string;
  /** km */
  crsDstnc?: string;
  /** 분 */
  crsTotlRqrmHour?: string;
  /** 1 쉬움 ~ 3 어려움 */
  crsLevel?: string;
  crsSummary?: string;
  /** 「충남 서산시」 꼴 */
  sigun?: string;
  gpxpath?: string;
}

/**
 * 실패의 종류. 화면은 이 값으로 문구를 고른다 — "고장"과 "오늘은 그만"과 "잠시 후"는 다른 안내다.
 *
 *   quota          일일 한도 초과(resultCode 22). 오늘은 다시 시도해도 소용없다
 *   rate_limited   초당 한도·HTTP 429. 잠시 후 다시 시도
 *   upstream       공공데이터포털 쪽 장애(5xx·4xx)
 *   timeout        제한 시간 초과
 *   network        연결 실패(오프라인 등)
 *   not_configured 서버에 서비스키가 없음(배포 설정 문제)
 *   api            그 밖의 TourAPI 오류 코드
 */
export type TourApiErrorKind =
  'quota' | 'rate_limited' | 'upstream' | 'timeout' | 'network' | 'not_configured' | 'api';

/** resultCode·종류를 들고 있는 에러. 어떤 종류의 실패인지 화면이 구분할 수 있게 한다. */
export class TourApiError extends Error {
  readonly kind: TourApiErrorKind;
  constructor(
    message: string,
    public readonly code: string,
    kind?: TourApiErrorKind,
  ) {
    super(message);
    this.name = 'TourApiError';
    this.kind = kind ?? (code === '22' ? 'quota' : 'api');
  }
}

/** 어떤 에러든 종류로 바꾼다. TourApiError 가 아니면 네트워크 문제로 본다. */
export function classifyTourError(error: unknown): TourApiErrorKind {
  if (error instanceof TourApiError) return error.kind;
  if (error instanceof Error && error.name === 'AbortError') return 'timeout';
  return 'network';
}

/** 다시 시도해 볼 만한 실패인지. 한도 초과와 설정 누락은 눌러도 소용없다. */
export function isRetryableTourError(error: unknown): boolean {
  const kind = classifyTourError(error);
  return kind !== 'quota' && kind !== 'not_configured';
}

/**
 * 일일 호출 한도 초과(코드 22)인지 본다.
 *
 * 서비스키 발급 상태(개발계정 1,000건/일)에 따라 실제로 부딪힐 수 있는 에러다.
 * 이때는 "고장"이 아니라 "오늘 그만 물어봐야 한다"는 뜻이므로, 화면에서
 * 다른 에러와 다른 문구(다시 시도 대신 "잠시 후")로 안내해야 한다.
 */
export function isQuotaExceededError(error: unknown): boolean {
  return error instanceof TourApiError && (error.code === '22' || error.kind === 'rate_limited');
}

interface TourApiResponse<T> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      items?: { item?: T | T[] };
      totalCount?: number;
    };
  };
}

/** items.item 은 결과가 1건일 때 배열이 아닌 객체로 내려온다. */
function normalizeItems<T>(data: TourApiResponse<T>): T[] {
  const item = data.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

/**
 * 동시 호출 수 제한 (에러코드 23 회피).
 *
 * 홈 화면 1회 로드는 붐빔 후보 6 + 코스 8 = 14회를 부른다(2026-08-28: 붐빔 후보 12→6).
 * 각 화면이 `Promise.all` 로 묶어 쏘기 때문에, 막지 않으면 20개가 거의 동시에 나간다.
 * TourAPI 는 일일 한도(코드 22)와 별개로 **초당 한도(코드 23)** 가 있고,
 * 그 수치는 공개 문서에 없다 — 확인되지 않은 벽에 스스로 부딪힐 이유가 없다.
 *
 * 4로 잡은 근거: 21회를 4개씩 흘리면 약 6묶음이라 체감 지연이 크지 않으면서,
 * 초당 요청 수를 한 자릿수로 눌러 둔다. 수치가 확정되면(tourapi@knto.or.kr) 조정한다.
 *
 * 모든 호출이 `callTourApi` 를 지나므로 여기 한 곳만 막으면 전 화면에 적용된다.
 */
const gate = createConcurrencyGate(4);

async function callTourApi<T = TourApiSpot>(
  endpoint: string,
  params: Record<string, string | number>,
  service: string = DEFAULT_SERVICE,
): Promise<T[]> {
  return (await callTourApiPage<T>(endpoint, params, service)).items;
}

/** 중계(/api/tour)가 돌려주는 오류 껍데기 */
interface ProxyErrorResponse {
  error?: { kind?: string; status?: number; reason?: string };
}

const PROXY_KIND: Record<string, TourApiErrorKind> = {
  rate_limited: 'rate_limited',
  upstream: 'upstream',
  timeout: 'timeout',
  network: 'network',
  not_configured: 'not_configured',
  bad_request: 'api',
};

/**
 * 요청 URL. Node 도구(키 있음)는 직접, 브라우저는 중계로.
 * 중계 주소가 상대 경로(`/api/tour`)면 같은 출처다.
 */
function requestUrl(
  endpoint: string,
  service: string,
  params: Record<string, string | number>,
): string {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  );
  if (env.tourApiServiceKey) {
    query.set('serviceKey', env.tourApiServiceKey);
    query.set('MobileOS', 'ETC');
    query.set('MobileApp', MOBILE_APP);
    query.set('_type', 'json');
    return `${TOUR_API_ROOT}/${service}/${endpoint}?${query.toString()}`;
  }
  query.set('service', service);
  query.set('op', endpoint);
  return `${env.tourProxyUrl}?${query.toString()}`;
}

/** 공공데이터포털 게이트웨이가 한도 초과·연결 실패 때 내려주는 껍데기 (HTTP 200 으로 올 때도 있다) */
interface GatewayErrorResponse {
  OpenAPI_ServiceResponse?: { cmmMsgHeader?: { errMsg?: string; returnReasonCode?: string } };
  resultCode?: string;
  resultMsg?: string;
}

/** 목록과 전체 건수를 함께 돌려준다 — 두루누비처럼 여러 쪽을 이어 받을 때 쓴다. */
async function callTourApiPage<T = TourApiSpot>(
  endpoint: string,
  params: Record<string, string | number>,
  service: string = DEFAULT_SERVICE,
): Promise<{ items: T[]; totalCount: number }> {
  // 빈 배열로 조용히 넘기면 붐빔 지수에서 "아무것도 없음 = 아주 조용"으로 읽혀
  // 완전히 틀린 결과가 화면에 뜬다. 실패는 실패로 드러낸다 — 종류를 붙여서.
  const url = requestUrl(endpoint, service, params);

  await gate.acquire();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let data: TourApiResponse<T>;
  try {
    let res: Response;
    try {
      res = await fetch(url, { signal: controller.signal });
    } catch (error) {
      const aborted = error instanceof Error && error.name === 'AbortError';
      throw new TourApiError(
        aborted ? `TourAPI 응답 시간 초과: ${endpoint}` : `TourAPI 연결 실패: ${endpoint}`,
        aborted ? 'TIMEOUT' : 'NETWORK',
        aborted ? 'timeout' : 'network',
      );
    }
    if (!res.ok) {
      // 중계가 분류해 준 종류를 그대로 쓴다. 직접 호출(Node)에서는 상태코드로 나눈다.
      let proxyKind: string | undefined;
      try {
        proxyKind = ((await res.json()) as ProxyErrorResponse).error?.kind;
      } catch {
        proxyKind = undefined;
      }
      const kind: TourApiErrorKind =
        (proxyKind ? PROXY_KIND[proxyKind] : undefined) ??
        (res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'upstream' : 'api');
      throw new TourApiError(
        `TourAPI 호출 실패: ${endpoint} (HTTP ${res.status})`,
        String(res.status),
        kind,
      );
    }
    data = (await res.json()) as TourApiResponse<T>;
  } finally {
    clearTimeout(timer);
    gate.release();
  }

  // 게이트웨이 오류(일일 한도 초과 22, 연결 실패 05)와 잘못된 파라미터(10)는 response 껍데기 없이 온다
  if (!data.response) {
    const gw = data as unknown as GatewayErrorResponse;
    const header = gw.OpenAPI_ServiceResponse?.cmmMsgHeader;
    throw new TourApiError(
      `TourAPI 오류: ${header?.errMsg ?? gw.resultMsg ?? endpoint}`,
      header?.returnReasonCode ?? gw.resultCode ?? '??',
    );
  }
  if (data.response.header.resultCode !== '0000') {
    throw new TourApiError(
      `TourAPI 오류: ${data.response.header.resultMsg}`,
      data.response.header.resultCode,
    );
  }
  return { items: normalizeItems(data), totalCount: data.response.body?.totalCount ?? 0 };
}

/**
 * 승인된 언어 서비스만 고른다.
 * 영문(EngService2)은 2026-09-21 활용신청·승인 확인(배포 키로 resultCode 0000 실측).
 * 포르투갈어·이탈리아어는 관광공사에 서비스가 없어 **영어**로 보낸다 — 한글보다는 읽힌다(사장님 결정 9/21).
 * 결과가 비면 `callLocalized` 가 국문으로 한 번 더 부른다.
 */
export function serviceFor(language: Language): string {
  if (language === 'fr') return 'FreService2';
  if (language === 'es') return 'SpnService2';
  if (language === 'en' || language === 'pt' || language === 'it') return 'EngService2';
  return 'KorService2';
}

/** 외국어 서비스가 비어 있을 때만 국문을 한 번 더 요청한다. */
async function callLocalized<T = TourApiSpot>(
  endpoint: string,
  params: Record<string, string | number>,
  language: Language,
): Promise<T[]> {
  const service = serviceFor(language);
  const localized = await callTourApi<T>(endpoint, params, service);
  return localized.length === 0 && service !== DEFAULT_SERVICE
    ? callTourApi<T>(endpoint, params, DEFAULT_SERVICE)
    : localized;
}

/** 지역 코드 기준 인기 관광지 목록. */
export function getAreaBasedAttractions(areaCode: string, numOfRows = 10): Promise<TourApiSpot[]> {
  return callTourApi('areaBasedList2', {
    areaCode,
    contentTypeId: CONTENT_TYPE.관광지,
    numOfRows,
    pageNo: 1,
    arrange: 'P', // 인기순
  });
}

/**
 * 좌표 기준 반경 내 검색.
 *
 * `contentTypeId` 를 넘기지 않으면 모든 유형(관광지·음식점·숙박 등)이 한 번에 온다.
 * 붐빔 지수 계산은 유형별로 따로 호출하지 않고 이 방식으로 **1회만 호출한 뒤
 * `contenttypeid` 로 나눈다** — 호출 수를 유형 수만큼 줄이기 위해서다.
 */
export function getNearbyByLocation(
  mapX: number,
  mapY: number,
  options: {
    radiusMeters?: number;
    numOfRows?: number;
    contentTypeId?: number | null;
    language?: Language;
  } = {},
): Promise<TourApiSpot[]> {
  const {
    radiusMeters = 3000,
    numOfRows = 10,
    contentTypeId = CONTENT_TYPE.관광지,
    language = 'ko',
  } = options;
  return callLocalized(
    'locationBasedList2',
    {
      mapX,
      mapY,
      radius: radiusMeters,
      numOfRows,
      pageNo: 1,
      arrange: 'E', // 거리순
      // null 이면 파라미터 자체를 빼서 전체 유형을 받는다.
      ...(contentTypeId == null ? {} : { contentTypeId }),
    },
    language,
  );
}

/** 하위 호환용 별칭 — 기존 호출부에서 쓰던 이름. */
export function getNearbyAttractions(
  mapX: number,
  mapY: number,
  radiusMeters = 3000,
  numOfRows = 10,
  language: Language = 'ko',
): Promise<TourApiSpot[]> {
  return getNearbyByLocation(mapX, mapY, { radiusMeters, numOfRows, language });
}

/**
 * 이름으로 관광지를 찾는다.
 *
 * "붐비는 곳 대신 조용한 성지" 추천의 출발점이다. 사용자는 좌표를 모르고
 * "화성행궁"이라는 이름만 안다. 그 이름을 좌표로 바꿔야 붐빔을 계산할 수 있다.
 *
 * 관광지·문화시설만 받는다 — 음식점이나 숙소는 "대신 갈 곳"을 찾는 출발점이 되지 않는다.
 */
export function searchAttractionsByKeyword(
  keyword: string,
  numOfRows = 10,
  language: Language = 'ko',
): Promise<TourApiSpot[]> {
  return callLocalized(
    'searchKeyword2',
    {
      keyword,
      numOfRows,
      pageNo: 1,
      arrange: 'O', // 제목순 — 인기순(P)은 동명이지 구분에 도움이 안 된다
      contentTypeId: CONTENT_TYPE.관광지,
    },
    language,
  );
}

/**
 * 성지 주변의 **무장애 여행 정보** — 휠체어·경사로·장애인 화장실이 갖춰진 곳.
 *
 * 왜 이 앱에 필요한가: 신자 65세 이상이 28.9%다(한국 천주교회 통계 2025).
 * 성지는 계단·언덕이 많아 "갈 수 있는가"가 먼저 걸리는 곳인데, 그 정보를
 * 지금 아무도 안내하지 않는다. 한국관광공사의 무장애 정보를 성지 좌표에
 * 붙이면 그 공백이 메워진다.
 *
 * ⚠️ 호출 경로가 아직 실호출로 확인되지 않았다(`BARRIER_FREE_BASE_URL` 주석).
 * 확인 전까지 실패는 호출부에서 조용히 흡수되어 섹션 자체가 뜨지 않는다 —
 * 빈 껍데기를 보여주지 않는다는 원칙 그대로다.
 */
export function getBarrierFreeNearby(
  mapX: number,
  mapY: number,
  radiusMeters = 5000,
  numOfRows = 10,
): Promise<TourApiSpot[]> {
  return callTourApi(
    'locationBasedList2',
    {
      mapX,
      mapY,
      radius: radiusMeters,
      numOfRows,
      pageNo: 1,
      arrange: 'E', // 거리순
    },
    BARRIER_FREE_SERVICE,
  );
}

/**
 * 시·군·구의 관광지 집중률 예측(오늘부터 30일). `areaCd`·`signguCd` 둘 다 필수 —
 * 시·도만 넘기면 API 가 거절한다(2026-09-16 실측). 메모리에서만 잠깐 쓴다.
 *
 * 응답은 관광지별 30일치가 연달아 온다. 300행이면 관광지 약 10곳만 받아 서울 중구처럼
 * 1,650행이 필요한 지역에서 성지 이름 매칭이 잘린다. 현재 최대치를 한 번에 받아야
 * "정보 없음"을 실제 데이터 부재와 구분할 수 있다.
 */
export function getCongestionRates(areaCd: string, signguCd: string): Promise<CongestionRate[]> {
  return callTourApi<CongestionRate>(
    'tatsCnctrRatedList',
    { areaCd, signguCd, numOfRows: 2000, pageNo: 1 },
    'TatsCnctrRateService',
  );
}

/**
 * 법정동 코드표. `lDongRegnCd` 없이 부르면 시·도 목록, 시·도 코드를 넘기면 그 안의 시·군·구 목록.
 * 집중률 API 가 요구하는 `signguCd` = 시·도 2자리 + 시·군·구 3자리.
 */
export function getLdongCodes(lDongRegnCd?: string): Promise<LdongCode[]> {
  return callTourApi<LdongCode>(
    'ldongCode2',
    { numOfRows: 100, pageNo: 1, ...(lDongRegnCd ? { lDongRegnCd } : {}) },
    'KorService2',
  );
}

export function getRelatedSpots(
  areaCd: string,
  signguCd: string,
  baseYm: string,
): Promise<RelatedSpot[]> {
  return callTourApi<RelatedSpot>(
    'areaBasedList1',
    { areaCd, signguCd, baseYm, numOfRows: 20, pageNo: 1 },
    'TarRlteTarService1',
  );
}

export function getHubSpots(areaCd: string, signguCd: string, baseYm: string): Promise<HubSpot[]> {
  return callTourApi<HubSpot>(
    'areaBasedList1',
    { areaCd, signguCd, baseYm, numOfRows: 20, pageNo: 1 },
    'LocgoHubTarService1',
  );
}

export function getAudioStoriesNearby(
  mapX: number,
  mapY: number,
  langCode: 'ko' | 'en' | 'ja' | 'zh',
): Promise<AudioStory[]> {
  return callTourApi<AudioStory>(
    'storyLocationBasedList',
    { mapX, mapY, radius: 3000, langCode, numOfRows: 10, pageNo: 1 },
    'Odii',
  );
}

// 두루누비 걷기길은 위치·시군구 검색 파라미터가 없다(sigunguNm 은 INVALID_REQUEST_PARAMETER — 2026-09-14 실측).
// 전체 141코스를 한 번 받아 메모리에 두고(저장 아님, 새로고침하면 사라짐) 주소로 거른다.
// numOfRows 200 한 번은 SERVICETIMEOUT 이 나서 50개씩 나눠 받는다.
let allWalkingCourses: Promise<WalkingCourse[]> | null = null;

async function fetchAllWalkingCourses(): Promise<WalkingCourse[]> {
  const first = await callTourApiPage<WalkingCourse>(
    'courseList',
    { brdDiv: 'DNWW', numOfRows: 50, pageNo: 1 },
    'Durunubi',
  );
  const pages = Math.min(6, Math.ceil(first.totalCount / 50));
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      callTourApi<WalkingCourse>(
        'courseList',
        { brdDiv: 'DNWW', numOfRows: 50, pageNo: i + 2 },
        'Durunubi',
      ),
    ),
  );
  return [...first.items, ...rest.flat()];
}

/** 시·도(짧은 이름)와 시·군·구가 모두 맞는 걷기길. 「부산 중구」와 「서울 중구」를 섞지 않는다. */
export async function getWalkingCoursesNear(
  region: string,
  district: string,
): Promise<WalkingCourse[]> {
  allWalkingCourses ??= fetchAllWalkingCourses().catch((error) => {
    allWalkingCourses = null; // 실패는 기억하지 않는다
    throw error;
  });
  const courses = await allWalkingCourses;
  return courses.filter((c) => {
    const [sido, ...sigungu] = (c.sigun ?? '').trim().split(/\s+/);
    return sido === region && sigungu.join(' ') === district;
  });
}
