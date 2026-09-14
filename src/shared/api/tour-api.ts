/**
 * 한국관광공사 TourAPI(KorService2) 실시간 호출 클라이언트.
 *
 * 공모전 규정: OpenAPI 응답을 로컬 DB에 캐싱해 재사용하면 안 되고 매 요청마다
 * 실시간으로 호출해야 한다. 따라서 이 모듈은 절대 결과를 저장하지 않으며,
 * 서비스워커 런타임 캐시 대상에서도 제외되어 있다(vite.config.ts 참고).
 */

import { env } from '@/shared/config/env';
import { createConcurrencyGate } from '@/shared/lib/concurrency-gate';
import type { Language } from '@/shared/i18n/dictionary';

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const TOUR_API_ROOT = 'https://apis.data.go.kr/B551011';
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
const BARRIER_FREE_BASE_URL = 'https://apis.data.go.kr/B551011/KorWithService2';
const MOBILE_APP = 'VisitHolyKorea';

/** TourAPI 콘텐츠 타입 코드 (자주 쓰는 것만) */
export const CONTENT_TYPE = {
  관광지: 12,
  문화시설: 14,
  축제공연행사: 15,
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
  /** 축제 조회에서만 채워지는 기간 */
  eventstartdate?: string;
  eventenddate?: string;
}

/** 관광지 집중률은 일반 관광지 응답과 필드가 달라 별도 타입으로 둔다. */
export interface CongestionRate {
  baseYmd: string;
  areaNm: string;
  signguNm: string;
  tAtsNm: string;
  cnctrRate: string;
  mapX?: string;
  mapY?: string;
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

/** resultCode 를 들고 있는 에러. 어떤 종류의 실패인지 화면이 구분할 수 있게 한다. */
export class TourApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'TourApiError';
  }
}

/**
 * 일일 호출 한도 초과(코드 22)인지 본다.
 *
 * 서비스키 발급 상태(개발계정 1,000건/일)에 따라 실제로 부딪힐 수 있는 에러다.
 * 이때는 "고장"이 아니라 "오늘 그만 물어봐야 한다"는 뜻이므로, 화면에서
 * 다른 에러와 다른 문구(다시 시도 대신 "잠시 후")로 안내해야 한다.
 */
export function isQuotaExceededError(error: unknown): boolean {
  return error instanceof TourApiError && error.code === '22';
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
 * 홈 화면 1회 로드는 축제 1 + 붐빔 후보 6 + 코스 8 = 15회를 부른다(2026-08-28: 붐빔 후보 12→6).
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
  baseUrl: string = BASE_URL,
): Promise<T[]> {
  return (await callTourApiPage<T>(endpoint, params, baseUrl)).items;
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
  baseUrl: string = BASE_URL,
): Promise<{ items: T[]; totalCount: number }> {
  // 빈 배열로 조용히 넘기면 붐빔 지수에서 "아무것도 없음 = 아주 조용"으로 읽혀
  // 완전히 틀린 결과가 화면에 뜬다. 실패는 실패로 드러낸다.
  if (!env.tourApiServiceKey) {
    throw new Error('VITE_TOUR_API_SERVICE_KEY 가 설정되지 않았습니다 (.env.local 확인).');
  }

  const query = new URLSearchParams({
    serviceKey: env.tourApiServiceKey,
    MobileOS: 'ETC',
    MobileApp: MOBILE_APP,
    _type: 'json',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  await gate.acquire();
  let data: TourApiResponse<T>;
  try {
    const res = await fetch(`${baseUrl}/${endpoint}?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`TourAPI 호출 실패: ${endpoint} (HTTP ${res.status})`);
    }
    data = (await res.json()) as TourApiResponse<T>;
  } finally {
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

/** 승인된 언어 서비스만 고른다. 미승인 언어는 안전하게 국문 서비스로 보낸다. */
export function serviceFor(language: Language): string {
  if (language === 'fr') return 'FreService2';
  if (language === 'es') return 'SpnService2';
  // EngService2 승인 시: if (language === 'en') return 'EngService2';
  return 'KorService2';
}

function serviceUrl(language: Language): string {
  return `${TOUR_API_ROOT}/${serviceFor(language)}`;
}

/** 외국어 서비스가 비어 있을 때만 국문을 한 번 더 요청한다. */
async function callLocalized<T = TourApiSpot>(
  endpoint: string,
  params: Record<string, string | number>,
  language: Language,
): Promise<T[]> {
  const localized = await callTourApi<T>(endpoint, params, serviceUrl(language));
  return localized.length === 0 && language !== 'ko'
    ? callTourApi<T>(endpoint, params, BASE_URL)
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
    BARRIER_FREE_BASE_URL,
  );
}

/** TourAPI 날짜 형식(YYYYMMDD). */
export function toApiDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}${mm}${dd}`;
}

function todayYYYYMMDD(): string {
  return toApiDate(new Date());
}

/**
 * 성지 주변에서 오늘 이후 열리는 축제·행사.
 * 매일 바뀌는 데이터라 캐싱이 원천적으로 불가능하므로, 실시간 활용을 보여주기 가장 좋은 지점이다.
 */
export function getNearbyFestivals(
  mapX: number,
  mapY: number,
  radiusMeters = 10000,
  numOfRows = 10,
  language: Language = 'ko',
): Promise<TourApiSpot[]> {
  return callLocalized(
    'searchFestival2',
    {
      eventStartDate: todayYYYYMMDD(),
      mapX,
      mapY,
      radius: radiusMeters,
      numOfRows,
      pageNo: 1,
      arrange: 'E', // 거리순
    },
    language,
  );
}

/** 시·군·구의 관광지 집중률. 이 값은 브라우저 메모리의 짧은 Query 캐시에서만 쓴다. */
export function getCongestionRates(areaCd: string, signguCd?: string): Promise<CongestionRate[]> {
  return callTourApi<CongestionRate>(
    'tatsCnctrRatedList',
    { areaCd, ...(signguCd ? { signguCd } : {}), numOfRows: 200, pageNo: 1 },
    `${TOUR_API_ROOT}/TatsCnctrRateService`,
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
    `${TOUR_API_ROOT}/TarRlteTarService1`,
  );
}

export function getHubSpots(areaCd: string, signguCd: string, baseYm: string): Promise<HubSpot[]> {
  return callTourApi<HubSpot>(
    'areaBasedList1',
    { areaCd, signguCd, baseYm, numOfRows: 20, pageNo: 1 },
    `${TOUR_API_ROOT}/LocgoHubTarService1`,
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
    `${TOUR_API_ROOT}/Odii`,
  );
}

// 두루누비 걷기길은 위치·시군구 검색 파라미터가 없다(sigunguNm 은 INVALID_REQUEST_PARAMETER — 2026-09-14 실측).
// 전체 141코스를 한 번 받아 메모리에 두고(저장 아님, 새로고침하면 사라짐) 주소로 거른다.
// numOfRows 200 한 번은 SERVICETIMEOUT 이 나서 50개씩 나눠 받는다.
let allWalkingCourses: Promise<WalkingCourse[]> | null = null;

async function fetchAllWalkingCourses(): Promise<WalkingCourse[]> {
  const first = await callTourApiPage<WalkingCourse>('courseList', { brdDiv: 'DNWW', numOfRows: 50, pageNo: 1 }, `${TOUR_API_ROOT}/Durunubi`);
  const pages = Math.min(6, Math.ceil(first.totalCount / 50));
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      callTourApi<WalkingCourse>('courseList', { brdDiv: 'DNWW', numOfRows: 50, pageNo: i + 2 }, `${TOUR_API_ROOT}/Durunubi`),
    ),
  );
  return [...first.items, ...rest.flat()];
}

/** 시·도(짧은 이름)와 시·군·구가 모두 맞는 걷기길. 「부산 중구」와 「서울 중구」를 섞지 않는다. */
export async function getWalkingCoursesNear(region: string, district: string): Promise<WalkingCourse[]> {
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

/**
 * 오늘 진행 중인 전국 축제·행사 목록.
 *
 * 붐빔 지수의 핵심 입력이다. 성지마다 따로 묻지 않고 **전국을 한 번에 받아온 뒤
 * 성지와의 거리는 우리가 직접 계산한다** — 이것 하나로 호출 수가 성지 수(208)에서 1로 줄어든다.
 *
 * `eventStartDate` 는 "그 날짜 이후 시작하는 행사"를 뜻하므로, 오늘 이미 진행 중인 행사까지
 * 잡으려면 과거 날짜로 조회한 뒤 종료일을 보고 걸러야 한다.
 */
export async function getOngoingFestivals(
  options: { daysBack?: number; numOfRows?: number; maxPages?: number } = {},
): Promise<TourApiSpot[]> {
  // 한 페이지에 많이 받을수록 호출 수가 줄어든다. 전국 축제는 하루 수십~수백 건이라
  // 300건이면 대개 1회로 끝난다(실측 확인).
  const { daysBack = 60, numOfRows = 300, maxPages = 3 } = options;

  const from = new Date();
  from.setDate(from.getDate() - daysBack);
  const today = todayYYYYMMDD();

  const collected: TourApiSpot[] = [];
  for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
    const page = await callTourApi('searchFestival2', {
      eventStartDate: toApiDate(from),
      numOfRows,
      pageNo,
      arrange: 'A',
    });
    collected.push(...page);
    // 마지막 페이지에 닿으면 요청한 수보다 적게 온다.
    if (page.length < numOfRows) break;
  }

  // 오늘 진행 중인 것만 남긴다 (시작 ≤ 오늘 ≤ 종료).
  return collected.filter((spot) => {
    const start = spot.eventstartdate;
    const end = spot.eventenddate;
    if (!start || !end) return false;
    return start <= today && today <= end;
  });
}
