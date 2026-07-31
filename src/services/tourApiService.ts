/**
 * 한국관광공사 TourAPI(KorService2) 실시간 호출 서비스.
 *
 * 공모전 규정: OpenAPI 응답을 로컬 DB에 캐싱하지 않고 매 요청마다 실시간으로 호출해야 함.
 * 이 파일의 함수들은 절대 결과를 저장하지 않고, 호출할 때마다 원격 API를 직접 호출한다.
 */

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const SERVICE_KEY = import.meta.env.VITE_TOUR_API_SERVICE_KEY as string;
const MOBILE_APP = 'VisitHolyKorea';

export interface TourApiSpot {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2: string;
  mapx: string;
  mapy: string;
  firstimage: string;
  dist?: string;
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

function normalizeItems(data: TourApiResponse): TourApiSpot[] {
  const item = data.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

async function callTourApi(endpoint: string, params: Record<string, string | number>): Promise<TourApiSpot[]> {
  if (!SERVICE_KEY) {
    console.error('VITE_TOUR_API_SERVICE_KEY가 설정되지 않았습니다 (.env.local 확인).');
    return [];
  }

  const query = new URLSearchParams({
    serviceKey: SERVICE_KEY,
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

/** 지역 코드 기준 인기 관광지 목록 (contentTypeId=12: 관광지) */
export async function getAreaBasedAttractions(areaCode: string, numOfRows = 10): Promise<TourApiSpot[]> {
  return callTourApi('areaBasedList2', {
    areaCode,
    contentTypeId: 12,
    numOfRows,
    pageNo: 1,
    arrange: 'P', // 인기순(콘텐츠 수정일 기준)
  });
}

/** 좌표 기준 반경 내 관광지 검색 — 성지와 "도보권 혼잡 관광지" 짝짓기에 사용 */
export async function getNearbyAttractions(
  mapX: number,
  mapY: number,
  radiusMeters = 3000,
  numOfRows = 10,
): Promise<TourApiSpot[]> {
  return callTourApi('locationBasedList2', {
    mapX,
    mapY,
    radius: radiusMeters,
    contentTypeId: 12,
    numOfRows,
    pageNo: 1,
    arrange: 'E', // 거리순
  });
}
