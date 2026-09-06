/**
 * 「축제 가는 김에, 성지 한 곳」 — 오늘 열리는 축제에 그 지역 성지를 붙인다.
 *
 * 붐빔 피하기(`features/quiet`)와 방향이 정확히 반대다. 그쪽은 **붐비는 곳을 피해**
 * 성지로 보내고, 이쪽은 **이미 사람이 모인 행사에서** 성지로 끌어온다.
 * 둘이 한 쌍이 되어야 "관광데이터로 순례 수요를 만든다"는 이야기가 완성된다.
 *
 * 🔴 이 파일에는 API 호출이 없다. 순수 계산만 있어서 테스트로 고정할 수 있고,
 * TourAPI 응답이 저장 계층 근처에 가지 않는다는 것도 눈으로 확인된다.
 * 실제 조회는 `use-festivals.ts` 가 한다 — 전국 축제 **1회**가 전부다.
 */

import { combineCrowdingScore, festivalPressure } from '@/features/quiet/api/crowding-score';
import type { CrowdingScore } from '@/features/quiet/api/crowding-score';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { haversineKm } from '@/shared/lib/geo';
import { type Region } from '@/shared/lib/regions';
import type { Coordinates, HolySite } from '@/shared/types/domain';

export const FESTIVAL_PAIR = {
  /**
   * 성지를 찾을 반경(km). 붐빔 피하기와 같은 20km 다.
   * 이보다 멀면 "가는 김에"가 아니라 "다른 날 따로"가 된다.
   */
  radiusKm: 20,

  /**
   * 축제 하나에 붙일 성지 수.
   * 셋을 넘기면 카드가 목록이 되어 "한 곳 들르기"라는 제안이 흐려진다.
   */
  sitesPerFestival: 2,
} as const;

/** 축제에 붙는 성지 한 곳 */
export interface PairedSite {
  site: HolySite;
  /** 축제 좌표에서의 직선거리(km) */
  distanceKm: number;
  /**
   * 그 성지의 오늘 붐빔.
   *
   * 주변 인프라 조회(성지마다 1회)를 **일부러 하지 않는다.** 그러면 호출 수가
   * 성지 수에 비례해 늘어난다. 이미 받아 둔 전국 축제 목록만으로 낼 수 있는
   * 축제 압력 축만 쓰고, 그 사실은 배지에 「일부」로 표시된다(`isPartial`).
   */
  crowding: CrowdingScore;
}

/** 오늘 열리는 축제 한 건 + 그 옆 성지들 */
export interface FestivalWithSites {
  /** TourAPI contentid */
  id: string;
  title: string;
  address: string;
  /** YYYYMMDD. 값이 없으면 null */
  startDate: string | null;
  endDate: string | null;
  coordinates: Coordinates;
  /** 주소에서 읽어낸 시·도. 읽지 못하면 null (전체 목록에만 나온다) */
  region: Region | null;
  imageUrl: string | null;
  /** 반경 안의 성지. 가까운 순. 비어 있는 축제는 목록에 담지 않는다. */
  sites: PairedSite[];
}

// ---------------------------------------------------------------------------
// 주소 → 시·도
// ---------------------------------------------------------------------------

/**
 * 주소 앞머리로 시·도를 알아낸다.
 *
 * TourAPI 주소는 「경기도 수원시…」·「전북특별자치도 완주군…」처럼 법정 표기가 섞여 오고,
 * 우리 시·도 목록(`REGIONS`)은 「경기」·「전북」 같은 짧은 이름이다. 그래서 표를 둔다.
 *
 * 앞머리로만 본다 — 「경기도 광주시」를 '광주'로 잘못 읽지 않기 위해서다.
 */
const REGION_PREFIXES: ReadonlyArray<readonly [Region, readonly string[]]> = [
  ['서울', ['서울']],
  ['부산', ['부산']],
  ['대구', ['대구']],
  ['인천', ['인천']],
  ['광주', ['광주']],
  ['대전', ['대전']],
  ['울산', ['울산']],
  ['세종', ['세종']],
  ['경기', ['경기']],
  ['강원', ['강원']],
  ['충북', ['충청북도', '충북']],
  ['충남', ['충청남도', '충남']],
  ['전북', ['전라북도', '전북']],
  ['전남', ['전라남도', '전남']],
  ['경북', ['경상북도', '경북']],
  ['경남', ['경상남도', '경남']],
  ['제주', ['제주']],
];

/** 주소에서 시·도를 읽는다. 못 읽으면 null — 지어내지 않는다. */
export function regionOfAddress(address: string | null | undefined): Region | null {
  if (typeof address !== 'string') return null;
  const head = address.trim();
  if (!head) return null;

  for (const [region, prefixes] of REGION_PREFIXES) {
    for (const prefix of prefixes) {
      if (head.startsWith(prefix)) return region;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 표기
// ---------------------------------------------------------------------------

/**
 * TourAPI 날짜(YYYYMMDD)를 화면 표기로 바꾼다.
 *
 * 6개 국어 어디서나 같은 숫자 표기(2026.09.05)를 쓴다 — 달 이름을 언어별로
 * 번역하면 사전이 12배로 늘어나는데, 순례자가 필요한 것은 날짜 숫자뿐이다.
 * 형식이 어긋난 값은 있는 그대로 돌려준다(몰래 빈칸이 되면 원인을 찾기 어렵다).
 */
export function formatApiDate(value: string | null | undefined): string {
  if (typeof value !== 'string') return '';
  const digits = value.trim();
  if (!/^\d{8}$/.test(digits)) return digits;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 8)}`;
}

/** 축제 기간 한 줄. 하루짜리 행사는 날짜를 한 번만 쓴다. */
export function formatFestivalPeriod(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  const start = formatApiDate(startDate);
  const end = formatApiDate(endDate);
  if (!start) return end;
  if (!end || start === end) return start;
  return `${start} – ${end}`;
}

/** 거리 표기. 1km 미만은 미터로 — "0.4km"보다 "400m"가 걸어갈 만하다는 감이 온다. */
export function formatDistanceKm(km: number): string {
  if (!Number.isFinite(km) || km < 0) return '';
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

// ---------------------------------------------------------------------------
// 짝짓기
// ---------------------------------------------------------------------------

/** TourAPI 좌표 문자열을 숫자로. 0·빈값·문자는 좌표 없음으로 본다. */
function toCoords(spot: TourApiSpot): Coordinates {
  const lat = Number(spot.mapy);
  const lng = Number(spot.mapx);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    return { lat: null, lng: null };
  }
  return { lat, lng };
}

export interface PairOptions {
  radiusKm?: number;
  sitesPerFestival?: number;
  /** null 이면 전국 */
  region?: Region | null;
}

/**
 * 오늘 열리는 축제 목록에 성지를 붙인다.
 *
 * **반경 안에 성지가 하나도 없는 축제는 결과에서 뺀다.** 성지 없는 축제만 늘어놓으면
 * 이 화면이 존재할 이유가 없다 — 우리가 주는 것은 축제 정보가 아니라 "그 옆의 성지"다.
 *
 * 정렬은 **가장 가까운 성지까지의 거리** 오름차순이다. 축제 규모나 인기 순이 아니라
 * "여기서 성지가 정말 가깝다"가 이 화면의 값어치이므로, 그 값으로 줄을 세운다.
 */
export function pairFestivalsWithSites(
  festivals: TourApiSpot[],
  sites: HolySite[],
  options: PairOptions = {},
): FestivalWithSites[] {
  const {
    radiusKm = FESTIVAL_PAIR.radiusKm,
    sitesPerFestival = FESTIVAL_PAIR.sitesPerFestival,
    region = null,
  } = options;

  // 잘못된 입력(null·비배열)이 와도 화면이 죽지 않게 한다. 축제 API 는 우리 것이 아니다.
  const festivalList = Array.isArray(festivals) ? festivals : [];
  const siteList = Array.isArray(sites) ? sites : [];

  const locatedSites = siteList.filter(
    (site) => site?.coordinates?.lat != null && site.coordinates.lng != null,
  );

  const paired: FestivalWithSites[] = [];

  for (const spot of festivalList) {
    if (!spot?.contentid) continue;

    const coordinates = toCoords(spot);
    const { lat, lng } = coordinates;
    if (lat == null || lng == null) continue;

    const address = [spot.addr1, spot.addr2].filter(Boolean).join(' ').trim();
    const spotRegion = regionOfAddress(spot.addr1 || address);
    // 시·도를 고른 상태에서 주소를 못 읽은 축제는 넣지 않는다 — 다른 지역일 수 있다.
    if (region && spotRegion !== region) continue;

    const nearby = locatedSites
      .map((site) => ({
        site,
        distanceKm: haversineKm(lat, lng, site.coordinates.lat!, site.coordinates.lng!),
      }))
      .filter((entry) => entry.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, Math.max(0, sitesPerFestival));

    if (nearby.length === 0) continue;

    paired.push({
      id: spot.contentid,
      title: spot.title ?? '',
      address,
      startDate: spot.eventstartdate || null,
      endDate: spot.eventenddate || null,
      coordinates,
      region: spotRegion,
      imageUrl: spot.firstimage || null,
      sites: nearby.map(({ site, distanceKm }) => ({
        site,
        distanceKm,
        // 이미 받아 둔 전국 축제 목록만 쓴다. 여기서 API 를 더 부르지 않는다.
        crowding: combineCrowdingScore(festivalPressure(site.coordinates, festivalList), null),
      })),
    });
  }

  return paired.sort((a, b) => (a.sites[0]?.distanceKm ?? 0) - (b.sites[0]?.distanceKm ?? 0));
}
