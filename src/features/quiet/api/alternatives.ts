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
import { DICTIONARY, fillPlaceholders, type Language } from '@/shared/i18n/dictionary';
import type { HolySite, Coordinates } from '@/shared/types/domain';
import { getNearbyByLocation, getOngoingFestivals, type TourApiSpot } from '@/shared/api/tour-api';
import {
  combineCrowdingScore,
  CROWDING_LEVELS,
  festivalPressure,
  infraDensity,
  RADIUS_KM,
  toCrowdingLevel,
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

  /**
   * "걸어서 갈 만한 거리일 수 있다"고 표시할 상한(km). 직선거리 기준이라 실제 도보 시간은
   * 계산하지 않는다 — 강·철도·산이 있으면 직선 2km 가 도보 1시간이 될 수 있다.
   */
  walkableKm: 2,
} as const;

// ---------------------------------------------------------------------------
// 이동 수단 추정
// ---------------------------------------------------------------------------

export interface TravelEstimate {
  /** 직선 2km 이내면 '도보권'(걸어갈 만할 수 있음), 그 밖은 대중교통·차 */
  mode: '도보권' | '대중교통·차';
  /** 직선거리(km). 실제 이동 거리가 아니다. */
  distanceKm: number;
  /** 화면에 그대로 쓰는 문구 — "직선거리 1.5km · 참고값" */
  label: string;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/**
 * 거리로 이동 부담을 표시한다.
 *
 * 소요 시간은 **도보·차·대중교통 어느 것도 추정하지 않는다.** 예전에는 직선거리를 4.5km/h 로
 * 나눠 "도보 20분"이라 적었는데, 그 값은 실제 길과 무관한 계산이라 틀릴 때 신뢰가 깨진다.
 * 직선거리를 참고값이라고 밝히고, 2km 이내는 "걸어갈 만할 수 있다"는 정도로만 말한다.
 */
export function estimateTravel(distanceKm: number, language: Language = 'ko'): TravelEstimate {
  const walkable = distanceKm <= ALTERNATIVE.walkableKm;
  return {
    mode: walkable ? '도보권' : '대중교통·차',
    distanceKm,
    label: fillPlaceholders(DICTIONARY.straightLineLabel[language], {
      distance: formatDistance(distanceKm),
    }),
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

/**
 * 추천이 어떻게 끝났는지. 화면은 이 값으로 문장을 고른다.
 *   recommended        등급이 실제로 내려가는 곳을 찾았다
 *   relaxed            크게 한적하진 않지만 조금 조용한 곳만 있다
 *   origin_quiet       출발지가 이미 조용하다 — 이동을 권하지 않는다
 *   origin_unverified  출발지의 주변 정보를 못 받아 비교할 수 없다 — 추천하지 않는다
 *   none               반경 안에 확인된 대안이 없다
 */
export type RankOutcome = 'recommended' | 'relaxed' | 'origin_quiet' | 'origin_unverified' | 'none';

export interface RankResult {
  picks: Alternative[];
  /**
   * 최소 개선폭을 만족하는 곳이 없어 기준을 풀었는지.
   * true 면 화면에서 "크게 한적하진 않습니다"라고 정직하게 알려야 한다.
   */
  relaxed: boolean;
  /** 주변 정보를 못 받아 순위에서 뺀 후보. "확인 부족"으로 따로 보여준다. */
  unverified: Alternative[];
  outcome: RankOutcome;
}

/** 붐빔 등급의 순번. 클수록 붐빈다. 점수가 아니라 등급으로 비교할 때 쓴다. */
function levelRank(score: number): number {
  return CROWDING_LEVELS.indexOf(toCrowdingLevel(score));
}

/** 「조용」 이하면 이미 한적한 곳이다. 여기서 다른 곳으로 옮기라고 권하지 않는다. */
const QUIET_ENOUGH_RANK = CROWDING_LEVELS.indexOf('조용');

export interface RankOptions {
  limit?: number;
  searchRadiusKm?: number;
  minRelief?: number;
  /** 출발지의 주변 정보를 못 받았는지. true 면 비교 자체를 하지 않는다. */
  originUnverified?: boolean;
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
  language: Language = 'ko',
): RankResult {
  const {
    limit = 3,
    searchRadiusKm = ALTERNATIVE.searchRadiusKm,
    minRelief = ALTERNATIVE.minRelief,
    originUnverified = false,
  } = options;

  const { lat, lng } = origin;
  if (lat == null || lng == null) return { picks: [], relaxed: false, unverified: [], outcome: 'none' };

  // 출발지 자체를 비교할 수 없으면 어떤 곳도 "더 조용하다"고 말할 근거가 없다.
  if (originUnverified) {
    return { picks: [], relaxed: false, unverified: [], outcome: 'origin_unverified' };
  }

  // 이미 조용한 곳에서 다른 곳으로 가라고 하면 불필요한 이동만 만든다.
  if (levelRank(originScore) <= QUIET_ENOUGH_RANK) {
    return { picks: [], relaxed: false, unverified: [], outcome: 'origin_quiet' };
  }

  const withinRadius: Alternative[] = [];
  const unverified: Alternative[] = [];

  for (const entry of scored) {
    const { lat: sLat, lng: sLng } = entry.site.coordinates;
    if (sLat == null || sLng == null) continue;

    const distanceKm = haversineKm(lat, lng, sLat, sLng);
    if (distanceKm > searchRadiusKm) continue;

    const alternative: Alternative = {
      ...entry,
      distanceKm,
      relief: Math.round((originScore - entry.crowding.score) * 10) / 10,
      travel: estimateTravel(distanceKm, language),
    };

    // 주변 정보를 못 받은 후보는 축제 점수만 남아 인위적으로 낮다. 순위에 넣으면
    // "조회에 실패한 곳일수록 1위"가 된다(2026-09-14 감사). 따로 떼어 "확인 부족"으로 보여준다.
    if (entry.crowding.isPartial) {
      unverified.push(alternative);
      continue;
    }
    withinRadius.push(alternative);
  }
  unverified.sort((a, b) => a.distanceKm - b.distanceKm);

  // ① 충분히 조용해지는 곳 → 가까운 순
  //
  // "충분히"의 조건이 둘이다. 개선폭(점)만 보면 최상위 등급에서 새는데,
  // 「매우 붐빔」은 70점 위가 전부 한 등급이라 95→77 처럼 18점이 내려가도
  // 여전히 「매우 붐빔」이다. 붐빔을 피하러 온 사람에게 붐비는 곳을 권하게 된다.
  // (실제로 경복궁 95.4 → 행주 성당 76.5 가 1위로 나왔다.)
  // 그래서 minRelief 주석이 원래 말한 대로 **등급이 실제로 내려가는지**를 함께 본다.
  const originLevel = levelRank(originScore);
  const meaningful = withinRadius.filter(
    (a) => a.relief >= minRelief && levelRank(a.crowding.score) < originLevel,
  );
  if (meaningful.length > 0) {
    return {
      picks: meaningful.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, limit),
      relaxed: false,
      unverified,
      outcome: 'recommended',
    };
  }

  // ② 없으면 기준을 풀되, 조금이라도 조용해지는 곳만. 여기서는 조용한 순으로 고른다.
  const anyBetter = withinRadius.filter((a) => a.relief > 0);
  return {
    picks: anyBetter.sort((a, b) => a.crowding.score - b.crowding.score).slice(0, limit),
    relaxed: anyBetter.length > 0,
    unverified,
    outcome: anyBetter.length > 0 ? 'relaxed' : 'none',
  };
}

/**
 * 추천 문구. "N점 더 조용"처럼 추정치끼리의 점수 차를 확정처럼 말하지 않는다.
 * 등급(예: 붐빔 → 조용)과 직선거리만 말한다 — 둘 다 화면에서 근거를 같이 보여줄 수 있는 값이다.
 */
export function buildAlternativeReason(
  originName: string,
  originLevelLabel: string,
  alternative: Alternative,
  language: Language = 'ko',
  levelLabel: string = alternative.crowding.level,
): string {
  return fillPlaceholders(DICTIONARY.alternativeReasonTemplate[language], {
    origin: originName,
    originLevel: originLevelLabel,
    level: levelLabel,
    distance: formatDistance(alternative.travel.distanceKm),
  });
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

export interface AlternativeResult extends RankResult {
  origin: CrowdedOrigin;
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
  language: Language = 'ko',
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
    return { origin, picks: [], relaxed: false, unverified: [], outcome: 'none' };
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

  const ranked = rankAlternatives(
    originCoords,
    originCrowding.score,
    scored,
    { ...rankOptions, originUnverified: originCrowding.isPartial },
    language,
  );

  return { origin, ...ranked };
}
