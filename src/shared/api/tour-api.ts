/**
 * 한국관광공사 TourAPI(KorService2) 실시간 호출 클라이언트.
 *
 * 공모전 규정: OpenAPI 응답을 로컬 DB에 캐싱해 재사용하면 안 되고 매 요청마다
 * 실시간으로 호출해야 한다. 따라서 이 모듈은 절대 결과를 저장하지 않으며,
 * 서비스워커 런타임 캐시 대상에서도 제외되어 있다(vite.config.ts 참고).
 */

import { env } from '@/shared/config/env';

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const MOBILE_APP = 'VisitHolyKorea';

/** TourAPI 콘텐츠 타입 코드 (자주 쓰는 것만) */
export const CONTENT_TYPE = {
  관광지: 12,
  문화시설: 14,
  축제공연행사: 15,
  숙박: 32,
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

async function callTourApi(
  endpoint: string,
  params: Record<string, string | number>,
): Promise<TourApiSpot[]> {
  if (!env.tourApiServiceKey) {
    console.error('VITE_TOUR_API_SERVICE_KEY 가 설정되지 않았습니다 (.env.local 확인).');
    return [];
  }

  const query = new URLSearchParams({
    serviceKey: env.tourApiServiceKey,
    MobileOS: 'ETC',
    MobileApp: MOBILE_APP,
    _type: 'json',
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });

  const res = await fetch(`${BASE_URL}/${endpoint}?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`TourAPI 호출 실패: ${endpoint} (HTTP ${res.status})`);
  }
  const data = (await res.json()) as TourApiResponse;
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

/** 좌표 기준 반경 내 검색 — 성지와 "도보권 관광지" 짝짓기에 사용한다. */
export function getNearbyByLocation(
  mapX: number,
  mapY: number,
  options: { radiusMeters?: number; numOfRows?: number; contentTypeId?: number } = {},
): Promise<TourApiSpot[]> {
  const { radiusMeters = 3000, numOfRows = 10, contentTypeId = CONTENT_TYPE.관광지 } = options;
  return callTourApi('locationBasedList2', {
    mapX,
    mapY,
    radius: radiusMeters,
    contentTypeId,
    numOfRows,
    pageNo: 1,
    arrange: 'E', // 거리순
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

function todayYYYYMMDD(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}${mm}${dd}`;
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
