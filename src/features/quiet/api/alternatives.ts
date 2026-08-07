/**
 * "거기 붐비면, 대신 여기는 어떠세요" — 대체지 추천.
 *
 * 공모전 지정과제 2번(유명 관광지 쏠림 완화)에 가장 직접적으로 답하는 기능이다.
 * 접수 기획서의 사례가 그대로 이 형태다:
 *
 *     화성행궁(혼잡) → 도보 20분 → 수원 화성 순교성지(한적)
 *
 * 오버투어리즘 해소는 "조용한 곳 목록"을 보여주는 것만으로는 일어나지 않는다.
 * **사람이 이미 가려고 마음먹은 붐비는 장소**를 출발점으로 잡고, 거기서 갈 수 있는
 * 조용한 대안을 내밀어야 실제로 발길이 나뉜다. 그래서 이 모듈의 입력은
 * 성지가 아니라 **관광지**다.
 *
 * 이 파일의 순위 결정은 전부 순수 함수다. API 호출은 아래쪽 조립부에만 있다.
 */

import { haversineKm } from '@/shared/lib/geo';
import type { HolySite, Coordinates } from '@/shared/types/domain';
import { getNearbyByLocation, getOngoingFestivals, type TourApiSpot } from '@/shared/api/tour-api';
import {
  combineCrowdingScore,
  festivalPressure,
  infraDensity,
  RADIUS_KM,
  type CrowdingScore,
} from './crowding-score';

// ---------------------------------------------------------------------------
// 상수 — 발표자료에 그대로 공개할 값들
// ---------------------------------------------------------------------------

export const ALTERNATIVE = {
  /**
   * 대체지를 찾을 반경(km).
   * 이보다 멀면 "대신 간다"가 아니라 "다른 날 간다"가 된다. 같은 일정 안에서
   * 선택을 바꿀 수 있는 거리여야 추천이 실제 행동으로 이어진다.
   */
  searchRadiusKm: 20,

  /**
   * 최소 개선폭(점).
   * 82점짜리 관광지 옆에 78점짜리 성지를 권하는 건 아무 의미가 없다.
   * 붐빔 등급 구간이 15~20점 간격이므로, 최소 한 등급은 내려가야 권할 값어치가 있다.
   */
  minRelief: 15,

  /** 도보로 안내할 상한(km). 이 이상은 대중교통·차로 표기한다. */
  walkableKm: 2,

  /** 도보 속도(km/h). 성지 순례 인구를 감안해 보수적으로 잡았다. */
  walkingKmh: 4.5,
} as const;

// ---------------------------------------------------------------------------
// 이동 수단 추정
// ---------------------------------------------------------------------------

export interface TravelEstimate {
  mode: '도보' | '대중교통·차';
  distanceKm: number;
  /** 도보일 때만 채워진다. 차·대중교통 소요는 우리가 알 수 없어 넣지 않는다. */
  walkMinutes: number | null;
  /** 화면에 그대로 쓰는 문구 */
  label: string;
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/**
 * 거리로 이동 수단을 추정한다.
 *
 * 차·대중교통 소요 시간은 **일부러 추정하지 않는다.** 교통 상황을 모르는 채로
 * "15분"이라고 적으면 틀릴 때 신뢰가 깨진다. 도보만 계산 가능한 값이므로 도보만 적는다.
 */
export function estimateTravel(distanceKm: number): TravelEstimate {
  const walkable = distanceKm <= ALTERNATIVE.walkableKm;
  const walkMinutes = walkable
    ? Math.max(1, Math.round((distanceKm / ALTERNATIVE.walkingKmh) * 60))
    : null;

  return {
    mode: walkable ? '도보' : '대중교통·차',
    distanceKm,
    walkMinutes,
    label: walkable ? `도보 ${walkMinutes}분` : formatDistance(distanceKm),
  };
}

// ---------------------------------------------------------------------------
// 순위 결정 (순수 함수)
// ---------------------------------------------------------------------------

/** 붐빔 지수가 매겨진 성지 한 곳 */
export interface ScoredSite {
  site: HolySite;
  crowding: CrowdingScore;
}

export interface Alternative extends ScoredSite {
  distanceKm: number;
  /** 출발지보다 몇 점 조용해지는가. 클수록 좋다. */
  relief: number;
  travel: TravelEstimate;
}

export interface RankResult {
  picks: Alternative[];
  /**
   * 최소 개선폭을 만족하는 곳이 없어 기준을 풀었는지.
   * true 면 화면에서 "크게 한적하진 않습니다"라고 정직하게 알려야 한다.
   */
  relaxed: boolean;
}

export interface RankOptions {
  limit?: number;
  searchRadiusKm?: number;
  minRelief?: number;
}

/**
 * 대체지 순위.
 *
 * 정렬 기준을 "가장 조용한 곳"으로 두지 않았다. 20km 밖의 가장 조용한 성지보다
 * 2km 옆의 충분히 조용한 성지가 실제로는 더 나은 대안이기 때문이다.
 * 그래서 **① 충분히 조용해지는 곳만 남기고 ② 그중 가장 가까운 순**으로 고른다.
 * 사람이 실제로 판단하는 순서와 같고, 심사에서 설명하기도 쉽다.
 */
export function rankAlternatives(
  origin: Coordinates,
  originScore: number,
  scored: ScoredSite[],
  options: RankOptions = {},
): RankResult {
  const {
    limit = 3,
    searchRadiusKm = ALTERNATIVE.searchRadiusKm,
    minRelief = ALTERNATIVE.minRelief,
  } = options;

  const { lat, lng } = origin;
  if (lat == null || lng == null) return { picks: [], relaxed: false };

  const withinRadius: Alternative[] = [];

  for (const entry of scored) {
    const { lat: sLat, lng: sLng } = entry.site.coordinates;
    if (sLat == null || sLng == null) continue;

    const distanceKm = haversineKm(lat, lng, sLat, sLng);
    if (distanceKm > searchRadiusKm) continue;

    withinRadius.push({
      ...entry,
      distanceKm,
      relief: Math.round((originScore - entry.crowding.score) * 10) / 10,
      travel: estimateTravel(distanceKm),
    });
  }

  // ① 충분히 조용해지는 곳 → 가까운 순
  const meaningful = withinRadius.filter((a) => a.relief >= minRelief);
  if (meaningful.length > 0) {
    return {
      picks: meaningful.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit),
      relaxed: false,
    };
  }

  // ② 없으면 기준을 풀되, 조금이라도 조용해지는 곳만. 여기서는 조용한 순으로 고른다.
  const anyBetter = withinRadius.filter((a) => a.relief > 0);
  return {
    picks: anyBetter.sort((a, b) => a.crowding.score - b.crowding.score).slice(0, limit),
    relaxed: anyBetter.length > 0,
  };
}

/**
 * 추천 문구. 숫자만 던지지 않고 "왜 여기인지"를 한 문장으로 말한다.
 */
export function buildAlternativeReason(originName: string, alternative: Alternative): string {
  const { relief, travel } = alternative;
  const closer = travel.mode === '도보' ? travel.label : `${formatDistance(travel.distanceKm)}`;
  return `${originName}보다 ${Math.round(relief)}점 한적합니다 · ${closer}`;
}

// ---------------------------------------------------------------------------
// 조립부 — 여기서만 API를 부른다
// ---------------------------------------------------------------------------

/** 임의 좌표의 주변 인프라. 실패는 null 로 구분한다(빈 배열이면 "조용함"으로 오독된다). */
async function fetchInfraAt(coords: Coordinates, label: string): Promise<TourApiSpot[] | null> {
  const { lat, lng } = coords;
  if (lat == null || lng == null) return null;

  try {
    return await getNearbyByLocation(lng, lat, {
      radiusMeters: RADIUS_KM.infra * 1000,
      numOfRows: 50,
      contentTypeId: null,
    });
  } catch (e) {
    console.error(`주변 인프라 조회 실패 (${label}):`, e);
    return null;
  }
}

export interface CrowdedOrigin {
  /** TourAPI contentid */
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  imageUrl: string | null;
  crowding: CrowdingScore;
}

export interface AlternativeResult {
  origin: CrowdedOrigin;
  picks: Alternative[];
  relaxed: boolean;
}

export interface FindAlternativesOptions extends RankOptions {
  /** 인프라를 조회할 후보 수. 이 값이 곧 추가 호출 수다. */
  candidateCount?: number;
}

/**
 * 관광지 한 곳을 받아 그곳의 붐빔과 대체 성지를 함께 낸다.
 *
 * 호출 수 — 전국 축제 1회 + 관광지 인프라 1회 + 후보 성지 N회.
 * `quiet-sites.ts` 와 같은 2단계 전략을 쓴다. 반경 20km 안의 성지는 보통 몇 곳뿐이라
 * 후보가 자연히 좁혀지고, 기본 설정에서 총 8회를 넘지 않는다.
 */
export async function findAlternatives(
  spot: TourApiSpot,
  sites: HolySite[],
  options: FindAlternativesOptions = {},
): Promise<AlternativeResult> {
  const { candidateCount = 6, ...rankOptions } = options;
  const searchRadiusKm = rankOptions.searchRadiusKm ?? ALTERNATIVE.searchRadiusKm;

  const originCoords: Coordinates = {
    lat: Number(spot.mapy) || null,
    lng: Number(spot.mapx) || null,
  };

  // 축제는 전국 1회만 받아 출발지와 성지 모두에 재사용한다
  const festivals = await getOngoingFestivals();

  const originInfra = await fetchInfraAt(originCoords, spot.title);
  const originCrowding = combineCrowdingScore(
    festivalPressure(originCoords, festivals),
    originInfra ? infraDensity(originInfra) : null,
  );

  const origin: CrowdedOrigin = {
    id: spot.contentid,
    name: spot.title,
    address: [spot.addr1, spot.addr2].filter(Boolean).join(' ').trim(),
    coordinates: originCoords,
    imageUrl: spot.firstimage || null,
    crowding: originCrowding,
  };

  const { lat, lng } = originCoords;
  if (lat == null || lng == null) {
    return { origin, picks: [], relaxed: false };
  }

  // 반경 안의 성지만 추린 뒤, 축제 압력이 낮은 순으로 후보를 좁힌다
  const nearby = sites
    .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
    .map((site) => ({
      site,
      distanceKm: haversineKm(lat, lng, site.coordinates.lat!, site.coordinates.lng!),
    }))
    .filter((e) => e.distanceKm <= searchRadiusKm)
    .map(({ site }) => ({ site, pressure: festivalPressure(site.coordinates, festivals) }))
    .sort((a, b) => a.pressure.score - b.pressure.score)
    .slice(0, candidateCount);

  const scored: ScoredSite[] = await Promise.all(
    nearby.map(async ({ site, pressure }) => {
      const infra = await fetchInfraAt(site.coordinates, site.name);
      return {
        site,
        crowding: combineCrowdingScore(pressure, infra ? infraDensity(infra) : null),
      };
    }),
  );

  const { picks, relaxed } = rankAlternatives(
    originCoords,
    originCrowding.score,
    scored,
    rankOptions,
  );

  return { origin, picks, relaxed };
}
