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

export interface QuietSite {
  site: HolySite;
  crowding: CrowdingScore;
}

export interface FindQuietSitesOptions {
  /** 최종적으로 돌려줄 개수 */
  limit?: number;
  /** 2단계에서 인프라를 조회할 후보 수. 이 값이 곧 추가 호출 수다. */
  candidateCount?: number;
}

/** 주소의 시·군·구 이름과 관광공사 응답의 signguNm을 맞춘다. 코드표를 앱에 중복 저장하지 않는다. */
function matchingCongestion(site: HolySite, rates: CongestionRate[]) {
  const addressWords = site.location
    .replace(/[(),]/g, ' ')
    .split(/\s+/)
    .filter((word) => /시$|군$|구$/.test(word));
  const nearby = rates.filter((rate) => {
    const nameMatches = addressWords.some(
      (word) => rate.signguNm.includes(word) || word.includes(rate.signguNm),
    );
    if (!nameMatches) return false;
    const lat = Number(rate.mapY);
    const lng = Number(rate.mapX);
    return (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat === 0 ||
      lng === 0 ||
      haversineKm(site.coordinates.lat!, site.coordinates.lng!, lat, lng) <= RADIUS_KM.festival
    );
  });
  const highest = nearby.reduce<CongestionRate | null>(
    (best, rate) => (!best || Number(rate.cnctrRate) > Number(best.cnctrRate) ? rate : best),
    null,
  );
  return highest && Number.isFinite(Number(highest.cnctrRate))
    ? { name: highest.tAtsNm, rate: Math.max(0, Math.min(100, Number(highest.cnctrRate))) }
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
 * 오늘 조용한 성지를 조용한 순으로 돌려준다.
 *
 * 2단계 조회를 거치지 못한 성지는 축제 압력만 반영된 임시 점수(`isPartial`)를 갖는다.
 * 후보 안에 들지 못한 곳들이라 어차피 상위 노출 대상이 아니다.
 */
export async function findQuietSites(
  sites: HolySite[],
  options: FindQuietSitesOptions = {},
): Promise<QuietSite[]> {
  // 12 → 6 (2026-08-28). 최종 노출은 limit(기본 3)곳뿐이라 2배 여유면 충분하고,
  // TourAPI 일일 호출 한도(개발계정 1,000건)를 홈 화면 1회 로드가 덜 쓰게 한다.
  const { limit = 3, candidateCount = 6 } = options;

  const located = sites.filter(hasCoordinates);
  if (located.length === 0) return [];

  // 1단계 — 전국 축제 1회 조회 후, 거리 계산은 로컬에서
  const festivals = await getOngoingFestivals();

  const withPressure = located.map((site) => ({
    site,
    pressure: festivalPressure(site.coordinates, festivals),
  }));

  // 축제 압력이 낮은 순으로 후보를 좁힌다
  const candidates = [...withPressure]
    .sort((a, b) => a.pressure.score - b.pressure.score)
    .slice(0, Math.max(candidateCount, limit));

  // 2단계 — 후보에만 인프라 조회
  const scored = await Promise.all(
    candidates.map(async ({ site, pressure }) => {
      const [infra, measured] = await Promise.all([
        fetchInfra(site),
        fetchMeasuredCongestion(site),
      ]);
      return {
        site,
        crowding: combineCrowdingScore(pressure, infra ? infraDensity(infra) : null, measured),
      };
    }),
  );

  return scored.sort((a, b) => a.crowding.score - b.crowding.score).slice(0, limit);
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
