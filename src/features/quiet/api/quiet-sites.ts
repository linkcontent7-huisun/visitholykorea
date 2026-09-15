/**
 * "오늘의 쉼표" — 오늘 조용한 성지를 찾아내는 조회 계층.
 *
 * 호출 수 설계가 이 파일의 핵심이다. 성지 208곳마다 축제·명소·식음을 따로 물으면
 * 한 번 화면을 그릴 때 600회가 넘는다. 인증키 한도를 넘기고, 사용자는 한참 기다린다.
 * 그래서 두 단계로 나눈다.
 *
 *   1단계 — 전국 축제를 **1회** 받아온다. 성지와의 거리는 우리 좌표로 직접 계산한다.
 *           이것만으로 208곳 전부의 축제 압력이 나온다. (호출 1회)
 *   2단계 — 1단계에서 조용해 보이는 상위 후보에만 주변 인프라를 묻는다. (후보 수만큼)
 *
 * 결과: 1 + N회(기본 6회, 2026-08-28 12→6). 정확도는 거의 그대로 두면서 호출을 100분의 1로 줄인다.
 *
 * TourAPI 응답은 이 과정 어디에도 저장하지 않는다. 매번 실시간으로 받아 계산하고 버린다.
 */

import {
  getCongestionRates,
  getNearbyByLocation,
  getOngoingFestivals,
  type CongestionRate,
  type TourApiSpot,
} from '@/shared/api/tour-api';
import { areaCodeForAddress } from '@/shared/lib/regions';
import { haversineKm } from '@/shared/lib/geo';
import type { HolySite } from '@/shared/types/domain';
import {
  combineCrowdingScore,
  festivalPressure,
  infraDensity,
  RADIUS_KM,
  type CrowdingScore,
} from './crowding-score';

/** 집중률 실측을 성지에 붙일 때 허용하는 거리(km). 이보다 멀면 그 관광지의 붐빔이 아니다. */
export const MEASURED_RADIUS_KM = 5;

/**
 * 관광공사 집중률 응답 중 이 성지에 붙일 한 건을 고른다.
 *
 * 응답에는 여러 날짜·여러 관광지가 섞여 온다. 예전에는 날짜를 보지 않고 시·군·구 이름이
 * 맞는 것 중 **최댓값**을 골라 체계적으로 과대추정했고, 좌표 없는 행은 거리 검증 없이
 * 통과시켰다(2026-09-14 감사). 지금은 ① 가장 최근 날짜의 행만 ② 좌표가 있고
 * ③ 성지에서 5km 이내인 것 중 ④ 가장 가까운 관광지 하나를 쓴다. 없으면 실측을 섞지 않는다.
 */
export function matchingCongestion(site: HolySite, rates: CongestionRate[]) {
  const { lat: siteLat, lng: siteLng } = site.coordinates;
  if (siteLat == null || siteLng == null) return undefined;

  const latestYmd = rates.reduce((max, r) => (r.baseYmd > max ? r.baseYmd : max), '');
  const candidates = rates
    .filter((rate) => rate.baseYmd === latestYmd && Number.isFinite(Number(rate.cnctrRate)))
    .map((rate) => {
      const lat = Number(rate.mapY);
      const lng = Number(rate.mapX);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) return null;
      return { rate, distanceKm: haversineKm(siteLat, siteLng, lat, lng) };
    })
    .filter((entry): entry is { rate: CongestionRate; distanceKm: number } => entry !== null)
    .filter((entry) => entry.distanceKm <= MEASURED_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearest = candidates[0];
  return nearest
    ? {
        name: nearest.rate.tAtsNm,
        rate: Math.max(0, Math.min(100, Number(nearest.rate.cnctrRate))),
        baseYmd: nearest.rate.baseYmd,
        distanceKm: Math.round(nearest.distanceKm * 10) / 10,
      }
    : undefined;
}

/**
 * 집중률은 시·도 단위로 하루치가 한 번에 오므로 같은 시·도는 한 번만 부른다 (메모리, 6시간).
 * 후보 6곳 + 상세 화면마다 부르다 2026-09-14 개발 계정 일일 한도(429)를 넘겼다.
 * 저장소(DB·localStorage)에는 넣지 않는다 — ADR 0002.
 */
const CONGESTION_TTL_MS = 6 * 60 * 60 * 1000;
const congestionByArea = new Map<string, { at: number; rates: Promise<CongestionRate[]> }>();

function congestionRatesFor(areaCd: string): Promise<CongestionRate[]> {
  const hit = congestionByArea.get(areaCd);
  if (hit && Date.now() - hit.at < CONGESTION_TTL_MS) return hit.rates;
  const rates = getCongestionRates(areaCd).catch((error) => {
    // 실패(한도 초과 등)는 캐시하지 않는다 — 다음 호출에서 다시 시도
    congestionByArea.delete(areaCd);
    throw error;
  });
  congestionByArea.set(areaCd, { at: Date.now(), rates });
  return rates;
}

/**
 * 성지가 속한 시·도의 집중률 행 전체. 「오늘의 성지 일정」이 오후 관광지 이름과 대조할 때 쓴다.
 * 시·도 코드를 못 찾거나 실패하면 빈 배열 — 화면은 집중률 자리를 비운다.
 */
export async function fetchCongestionRatesForSite(site: HolySite): Promise<CongestionRate[]> {
  const areaCd = areaCodeForAddress(site.location);
  if (!areaCd) return [];
  try {
    return await congestionRatesFor(areaCd);
  } catch (error) {
    console.warn(`관광지 집중률 조회 건너뜀 (${site.name}):`, error);
    return [];
  }
}

async function fetchMeasuredCongestion(site: HolySite) {
  const areaCd = areaCodeForAddress(site.location);
  if (!areaCd) return undefined;
  try {
    return matchingCongestion(site, await congestionRatesFor(areaCd));
  } catch (error) {
    console.warn(`관광지 집중률 조회 건너뜀 (${site.name}):`, error);
    return undefined;
  }
}

/** 좌표가 없는 성지는 거리 계산이 불가능해 지수를 낼 수 없다. */
function hasCoordinates(site: HolySite): boolean {
  return site.coordinates.lat != null && site.coordinates.lng != null;
}

/**
 * 2단계: 성지 한 곳의 주변 인프라를 1회 호출로 받아 온다.
 *
 * 실패했을 때 빈 배열을 돌려주면 "주변에 아무것도 없다 = 조용하다"로 잘못 읽힌다.
 * 그래서 실패는 `null` 로 구분해, 지수에 임시(`isPartial`) 표시가 남게 한다.
 */
async function fetchInfra(site: HolySite): Promise<TourApiSpot[] | null> {
  const { lat, lng } = site.coordinates;
  if (lat == null || lng == null) return null;

  try {
    return await getNearbyByLocation(lng, lat, {
      radiusMeters: RADIUS_KM.infra * 1000,
      numOfRows: 50,
      contentTypeId: null, // 전체 유형을 한 번에 받아 로컬에서 나눈다
    });
  } catch (e) {
    console.error(`주변 인프라 조회 실패 (${site.name}):`, e);
    return null;
  }
}

/**
 * 특정 성지 한 곳의 오늘 붐빔 지수. 상세 화면에서 쓴다.
 * 전국 축제 1회 + 인프라 1회 = 2회 호출.
 */
export async function getCrowdingForSite(site: HolySite): Promise<CrowdingScore | null> {
  if (!hasCoordinates(site)) return null;

  const [festivals, infra, measured] = await Promise.all([
    getOngoingFestivals(),
    fetchInfra(site),
    fetchMeasuredCongestion(site),
  ]);
  return combineCrowdingScore(
    festivalPressure(site.coordinates, festivals),
    infra ? infraDensity(infra) : null,
    measured,
  );
}
