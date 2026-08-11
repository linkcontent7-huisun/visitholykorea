/**
 * 한국관광공사 TourAPI(KorService2) 실시간 호출 클라이언트.
 *
 * 공모전 규정: OpenAPI 응답을 로컬 DB에 캐싱해 재사용하면 안 되고 매 요청마다
 * 실시간으로 호출해야 한다. 따라서 이 모듈은 절대 결과를 저장하지 않으며,
 * 서비스워커 런타임 캐시 대상에서도 제외되어 있다(vite.config.ts 참고).
 */

import { env } from '@/shared/config/env';
import { createConcurrencyGate } from '@/shared/lib/concurrency-gate';

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
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

interface TourApiResponse {
  response: {
    header: { resultCode: string; resultMsg: string };
    body?: {
      items?: { item?: TourApiSpot | TourApiSpot[] };
      totalCount?: number;
    };
  };
}

/** items.item 은 결과가 1건일 때 배열이 아닌 객체로 내려온다. */
function normalizeItems(data: TourApiResponse): TourApiSpot[] {
  const item = data.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

/**
 * 동시 호출 수 제한 (에러코드 23 회피).
 *
 * 홈 화면 1회 로드는 축제 1 + 붐빔 후보 12 + 코스 8 = 21회를 부른다.
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

async function callTourApi(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<TourApiSpot[]> {
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
  let data: TourApiResponse;
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}?${query.toString()}`);
    if (!res.ok) {
      throw new Error(`TourAPI 호출 실패: ${endpoint} (HTTP ${res.status})`);
    }
    data = (await res.json()) as TourApiResponse;
  } finally {
    gate.release();
  }

  if (data.response.header.resultCode !== '0000') {
    throw new Error(`TourAPI 오류: ${data.response.header.resultMsg}`);
  }
  return normalizeItems(data);
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
  options: { radiusMeters?: number; numOfRows?: number; contentTypeId?: number | null } = {},
): Promise<TourApiSpot[]> {
  const { radiusMeters = 3000, numOfRows = 10, contentTypeId = CONTENT_TYPE.관광지 } = options;
  return callTourApi('locationBasedList2', {
    mapX,
    mapY,
    radius: radiusMeters,
    numOfRows,
    pageNo: 1,
    arrange: 'E', // 거리순
    // null 이면 파라미터 자체를 빼서 전체 유형을 받는다.
    ...(contentTypeId == null ? {} : { contentTypeId }),
  });
}

/** 하위 호환용 별칭 — 기존 호출부에서 쓰던 이름. */
export function getNearbyAttractions(
  mapX: number,
  mapY: number,
  radiusMeters = 3000,
  numOfRows = 10,
): Promise<TourApiSpot[]> {
  return getNearbyByLocation(mapX, mapY, { radiusMeters, numOfRows });
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
): Promise<TourApiSpot[]> {
  return callTourApi('searchKeyword2', {
    keyword,
    numOfRows,
    pageNo: 1,
    arrange: 'O', // 제목순 — 인기순(P)은 동명이지 구분에 도움이 안 된다
    contentTypeId: CONTENT_TYPE.관광지,
  });
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
): Promise<TourApiSpot[]> {
  return callTourApi('searchFestival2', {
    eventStartDate: todayYYYYMMDD(),
    mapX,
    mapY,
    radius: radiusMeters,
    numOfRows,
    pageNo: 1,
    arrange: 'E', // 거리순
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
