/**
 * 붐빔 지수 산식.
 *
 * 한국관광공사 TourAPI에는 실시간 혼잡도 데이터가 없다. 그래서 공사가 주는 데이터
 * (오늘 열리는 축제·행사, 주변 관광 인프라 밀도)로 **붐빔을 추정**한다.
 * 추정이라는 점을 숨기지 않는 대신, 산식을 이 파일 한 곳에 모아 누구나 검증할 수 있게 둔다.
 *
 * 이 파일에는 API 호출이 없다. 순수 계산만 있어서 테스트로 고정할 수 있다.
 * 실제 조회와 조립은 `quiet-sites.ts` 가 한다.
 */

import { haversineKm } from '@/shared/lib/geo';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { CONTENT_TYPE } from '@/shared/api/tour-api';
import type { Coordinates } from '@/shared/types/domain';

// ---------------------------------------------------------------------------
// 산식 상수 — 발표자료에 그대로 공개할 값들
// ---------------------------------------------------------------------------

/** 각 축이 가져갈 수 있는 최대 점수. 합이 100이다. */
export const MAX_SCORE = {
  /** 오늘 열리는 축제·행사. 그날의 붐빔을 가장 크게 좌우하므로 비중이 가장 크다. */
  festival: 50,
  /** 주변 명소 밀도. 축제가 없어도 상시 사람이 있는 정도. */
  attraction: 30,
  /** 주변 음식점·숙박 밀도. 머무는 사람의 규모를 대신 보여주는 값. */
  stay: 20,
} as const;

/** 반경(km). 이 밖은 그날의 붐빔에 영향을 주지 않는다고 본다. */
export const RADIUS_KM = {
  /** 축제는 광역에서 사람을 끌어오므로 넓게 본다. */
  festival: 15,
  /** 명소·식음은 걸어서 닿는 범위. */
  infra: 3,
} as const;

/**
 * 포화 상수. 값이 이만큼일 때 해당 축의 63%에 도달한다.
 * 세 축 모두 같은 포화 함수를 써서 산식을 한 줄로 설명할 수 있게 했다.
 */
export const SATURATION = {
  festival: 1, // 가까운 축제 1개면 이미 영향이 크다
  attraction: 8,
  stay: 12,
} as const;

/**
 * 포화 곡선: `max * (1 - e^(-value/k))`
 *
 * 처음 몇 개가 붐빔을 크게 올리고, 이미 붐비는 곳에서는 몇 개 더 늘어도
 * 체감이 크지 않다는 성질을 반영한다. 상한을 넘지 않는 것도 보장된다.
 */
export function saturate(value: number, max: number, k: number): number {
  if (value <= 0) return 0;
  return max * (1 - Math.exp(-value / k));
}

// ---------------------------------------------------------------------------
// 축 ① 축제 압력
// ---------------------------------------------------------------------------

export interface FestivalPressure {
  score: number;
  /** 반경 안에 있는 행사 수 */
  count: number;
  /** 가장 가까운 행사 (반경 밖이라도 참고용으로 담는다) */
  nearest: { title: string; distanceKm: number } | null;
}

/**
 * 오늘 열리는 행사들과의 거리로 축제 압력을 낸다.
 * 가까울수록 가중치가 크고(선형 감쇠), 여러 개면 합산 뒤 포화시킨다.
 */
export function festivalPressure(site: Coordinates, festivals: TourApiSpot[]): FestivalPressure {
  const { lat, lng } = site;
  if (lat == null || lng == null) {
    return { score: 0, count: 0, nearest: null };
  }

  let weightSum = 0;
  let count = 0;
  let nearest: { title: string; distanceKm: number } | null = null;

  for (const festival of festivals) {
    const fLat = Number(festival.mapy);
    const fLng = Number(festival.mapx);
    if (!Number.isFinite(fLat) || !Number.isFinite(fLng) || fLat === 0 || fLng === 0) {
      continue;
    }

    const distanceKm = haversineKm(lat, lng, fLat, fLng);
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { title: festival.title, distanceKm };
    }

    if (distanceKm <= RADIUS_KM.festival) {
      count += 1;
      weightSum += 1 - distanceKm / RADIUS_KM.festival;
    }
  }

  return {
    score: saturate(weightSum, MAX_SCORE.festival, SATURATION.festival),
    count,
    nearest,
  };
}

// ---------------------------------------------------------------------------
// 축 ②③ 주변 인프라 밀도
// ---------------------------------------------------------------------------

/** 사람이 모이는 "볼거리"로 셀 유형 */
const ATTRACTION_TYPES: number[] = [
  CONTENT_TYPE.관광지,
  CONTENT_TYPE.문화시설,
  CONTENT_TYPE.레포츠,
  CONTENT_TYPE.쇼핑,
];

/** 사람이 "머무는" 시설로 셀 유형 */
const STAY_TYPES: number[] = [CONTENT_TYPE.음식점, CONTENT_TYPE.숙박];

export interface InfraDensity {
  attractionScore: number;
  stayScore: number;
  attractionCount: number;
  stayCount: number;
}

/** 반경 내 시설 목록을 유형별로 세어 밀도 점수를 낸다. */
export function infraDensity(spots: TourApiSpot[]): InfraDensity {
  let attractionCount = 0;
  let stayCount = 0;

  for (const spot of spots) {
    const typeId = Number(spot.contenttypeid);
    if (ATTRACTION_TYPES.includes(typeId)) attractionCount += 1;
    else if (STAY_TYPES.includes(typeId)) stayCount += 1;
  }

  return {
    attractionCount,
    stayCount,
    attractionScore: saturate(attractionCount, MAX_SCORE.attraction, SATURATION.attraction),
    stayScore: saturate(stayCount, MAX_SCORE.stay, SATURATION.stay),
  };
}

// ---------------------------------------------------------------------------
// 합산과 등급
// ---------------------------------------------------------------------------

export const CROWDING_LEVELS = ['아주 조용', '조용', '보통', '붐빔', '매우 붐빔'] as const;
export type CrowdingLevel = (typeof CROWDING_LEVELS)[number];

/** 점수 → 등급. 경계값은 등급이 낮은 쪽(더 조용한 쪽)에 포함된다. */
export function toCrowdingLevel(score: number): CrowdingLevel {
  if (score < 15) return '아주 조용';
  if (score < 30) return '조용';
  if (score < 50) return '보통';
  if (score < 70) return '붐빔';
  return '매우 붐빔';
}

export interface CrowdingBreakdown {
  festival: number;
  attraction: number;
  stay: number;
}

export interface CrowdingScore {
  /** 0(가장 조용) ~ 100(가장 붐빔) */
  score: number;
  level: CrowdingLevel;
  breakdown: CrowdingBreakdown;
  /** 화면에 그대로 쓸 수 있는 근거 문장 */
  reasons: string[];
  festivalCount: number;
  nearestFestival: { title: string; distanceKm: number } | null;
  attractionCount: number;
  stayCount: number;
  /** 주변 인프라를 조회하지 못해 축제 압력만으로 낸 점수인지 */
  isPartial: boolean;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * 축제 압력과 인프라 밀도를 합쳐 최종 지수를 만든다.
 * `density` 가 없으면(아직 조회 전) 축제 압력만으로 임시 점수를 낸다.
 */
export function combineCrowdingScore(
  pressure: FestivalPressure,
  density: InfraDensity | null,
): CrowdingScore {
  const breakdown: CrowdingBreakdown = {
    festival: round(pressure.score),
    attraction: round(density?.attractionScore ?? 0),
    stay: round(density?.stayScore ?? 0),
  };

  const score = round(breakdown.festival + breakdown.attraction + breakdown.stay);

  return {
    score,
    level: toCrowdingLevel(score),
    breakdown,
    reasons: buildReasons(pressure, density),
    festivalCount: pressure.count,
    nearestFestival: pressure.nearest,
    attractionCount: density?.attractionCount ?? 0,
    stayCount: density?.stayCount ?? 0,
    isPartial: density === null,
  };
}

/**
 * 사람이 읽는 근거. 숫자만 보여주면 믿지 않으므로 "왜 조용하다고 보는지"를 문장으로 남긴다.
 */
export function buildReasons(pressure: FestivalPressure, density: InfraDensity | null): string[] {
  const reasons: string[] = [];

  if (pressure.count === 0) {
    reasons.push(`반경 ${RADIUS_KM.festival}km에 오늘 열리는 행사가 없습니다`);
    if (pressure.nearest) {
      reasons.push(
        `가장 가까운 행사는 ${Math.round(pressure.nearest.distanceKm)}km 밖 (${pressure.nearest.title})`,
      );
    }
  } else {
    reasons.push(`반경 ${RADIUS_KM.festival}km에 오늘 열리는 행사 ${pressure.count}곳`);
    if (pressure.nearest) {
      const km = pressure.nearest.distanceKm;
      const distance = km < 1 ? `${Math.round(km * 1000)}m` : `${Math.round(km)}km`;
      reasons.push(`가장 가까운 행사 ${distance} (${pressure.nearest.title})`);
    }
  }

  if (density) {
    reasons.push(
      `반경 ${RADIUS_KM.infra}km 명소 ${density.attractionCount}곳 · 식당·숙소 ${density.stayCount}곳`,
    );
  }

  return reasons;
}
