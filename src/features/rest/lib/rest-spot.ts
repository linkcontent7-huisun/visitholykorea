/**
 * 쉼자리(spot) — 이 서비스가 실제로 안내하는 단위.
 *
 * 핵심 발상: **쉼자리는 건물이 아니라 "자리"다.**
 * 한 성당에 여러 개의 쉼자리가 있고, 각각 열리는 조건이 다르다.
 *
 *   성당 내부      → 본당 휴무일(월·화)에는 닫힌다
 *   성체조배실     → 별도 출입구로 길게 여는 곳이 많다 (확인 필요)
 *   성모상 앞      → 마당이라 늘 열려 있다
 *   정원·마당      → 늘 열려 있다
 *   십자가의 길    → 야외에 14처가 놓인 곳이 많다
 *
 * 이 구분이 있어야 **본당이 쉬는 월·화에도 안내할 자리가 남는다.**
 * 건물 단위로만 다루면 그 이틀은 서비스가 비어 버린다.
 *
 * 또 하나의 축은 **이 정보를 얼마나 믿을 수 있는가**다.
 * 자리 정보는 SNS 사진에서 짐작한 것부터 직접 가서 확인한 것까지 신뢰도가 천차만별이라,
 * 근거를 항상 함께 들고 다닌다. 짐작을 사실처럼 보여주면 헛걸음이 우리 탓이 된다.
 */

import {
  estimateOpenness,
  type OpennessResult,
  type RestPlaceKind,
  type VerifiedOpening,
} from './opening-pattern';

// ---------------------------------------------------------------------------
// 자리의 종류
// ---------------------------------------------------------------------------

export const REST_SPOT_KINDS = [
  '성당 내부',
  '성체조배실',
  '성모상 앞',
  '정원·마당',
  '십자가의 길',
  '야외 제대',
] as const;

export type RestSpotKind = (typeof REST_SPOT_KINDS)[number];

/** 실내인지 야외인지 — 개방 조건을 가르는 가장 큰 기준 */
export type SpotPlacement = '실내' | '야외';

const SPOT_PLACEMENT: Record<RestSpotKind, SpotPlacement> = {
  '성당 내부': '실내',
  성체조배실: '실내',
  '성모상 앞': '야외',
  '정원·마당': '야외',
  '십자가의 길': '야외',
  '야외 제대': '야외',
};

export function placementOf(kind: RestSpotKind): SpotPlacement {
  return SPOT_PLACEMENT[kind];
}

// ---------------------------------------------------------------------------
// 근거의 등급
// ---------------------------------------------------------------------------

/**
 * 이 자리 정보를 어디서 얻었는가.
 *
 * 실제 작업 순서가 그대로 등급이 된다 —
 * SNS 사진으로 후보를 잡고(`추정`), 홈페이지로 확인하고(`자료확인`),
 * 직접 가서 사진을 찍어 확정한다(`방문확인`).
 */
export const VERIFICATION_LEVELS = ['방문확인', '자료확인', '추정'] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

export interface SpotEvidence {
  level: VerificationLevel;
  /** 확인한 날짜 (YYYY-MM-DD). 방문확인일 때 특히 중요하다 */
  checkedAt?: string;
  /** 근거 출처 — 성당 홈페이지 주소, 인스타 게시물 등 */
  sourceUrl?: string;
}

/** 화면에 그대로 쓸 수 있는 근거 문구. 신뢰도를 부풀리지 않는다. */
export function evidenceLabel(evidence: SpotEvidence): string {
  switch (evidence.level) {
    case '방문확인':
      return evidence.checkedAt
        ? `${evidence.checkedAt}에 직접 가서 확인했어요`
        : '직접 가서 확인한 자리예요';
    case '자료확인':
      return '성당이 공개한 자료로 확인했어요';
    case '추정':
      return '사진으로 짐작한 정보예요. 가시기 전에 확인해 주세요';
  }
}

/** 근거가 약한 자리는 화면에서 덜 강조한다. 정렬에 쓴다. */
export function evidenceWeight(level: VerificationLevel): number {
  return { 방문확인: 2, 자료확인: 1, 추정: 0 }[level];
}

// ---------------------------------------------------------------------------
// 자리 하나
// ---------------------------------------------------------------------------

export interface RestSpot {
  id: string;
  /** 어느 시설에 딸린 자리인가 */
  placeId: string;
  placeName: string;
  placeKind: RestPlaceKind;
  kind: RestSpotKind;
  /** "성모상은 성당 오른편 화단 옆에 있어요" 같은 찾아가는 요령 */
  howToFind?: string;
  evidence: SpotEvidence;
  /** 이 자리만의 확인된 개방 정보 (성체조배실 24시간 개방 등) */
  verifiedOpening?: VerifiedOpening;
}

export interface SpotAvailability extends OpennessResult {
  placement: SpotPlacement;
  /** 근거 문구 */
  evidenceNote: string;
  /** 밤·궂은 날씨 등 주의 사항 */
  cautionNote?: string;
}

/** 야외 자리는 늘 열려 있지만, 어두우면 권하지 않는다. */
function outdoorCaution(hour: number): string | undefined {
  if (hour >= 21 || hour < 6) {
    return '밤에는 어둡고 인적이 드물어요. 낮에 오시는 편이 좋아요';
  }
  return undefined;
}

/**
 * 이 자리에 지금 갈 수 있는지 판단한다.
 *
 * - 야외 자리: 건물이 닫혀도 열려 있다. **본당 휴무일에도 살아 있는 것이 이것이다**
 * - 실내 자리: 시설의 요일 패턴을 따른다
 * - 성체조배실: 길게 여는 곳이 많지만 곳마다 달라, 확인된 정보가 없으면 단정하지 않는다
 */
export function spotAvailability(spot: RestSpot, at: Date = new Date()): SpotAvailability {
  const placement = placementOf(spot.kind);
  const evidenceNote = evidenceLabel(spot.evidence);
  const hour = at.getHours();

  if (placement === '야외') {
    // 확인된 정보가 있으면 그것이 우선한다 (밤에 잠그는 마당도 있다)
    if (spot.verifiedOpening) {
      const result = estimateOpenness(spot.placeKind, at, spot.verifiedOpening);
      return {
        ...result,
        placement,
        evidenceNote,
        ...(outdoorCaution(hour) ? { cautionNote: outdoorCaution(hour)! } : {}),
      };
    }

    return {
      status: '열림',
      confidence: spot.evidence.level === '방문확인' ? '확인됨' : '추정',
      reason: '마당에 있는 자리라 건물이 닫혀도 들어갈 수 있어요',
      placement,
      evidenceNote,
      ...(outdoorCaution(hour) ? { cautionNote: outdoorCaution(hour)! } : {}),
    };
  }

  // 성체조배실은 별도 출입구로 길게 여는 곳이 많지만, 확인 전에는 단정하지 않는다
  if (spot.kind === '성체조배실' && !spot.verifiedOpening) {
    return {
      status: '확인필요',
      confidence: '추정',
      reason: '성체조배실은 여는 시간이 곳마다 달라요. 가시기 전에 확인해 주세요',
      placement,
      evidenceNote,
    };
  }

  const result = estimateOpenness(spot.placeKind, at, spot.verifiedOpening);
  return { ...result, placement, evidenceNote };
}

/**
 * 한 시설의 자리들 중 지금 갈 수 있는 것만 추린다.
 *
 * 본당이 쉬는 월·화에 이 함수가 야외 자리를 돌려주는 것이 요점이다 —
 * "오늘은 닫혔습니다"로 끝내지 않고 **대신 갈 수 있는 자리**를 내놓는다.
 */
export function availableSpots(
  spots: RestSpot[],
  at: Date = new Date(),
): { spot: RestSpot; availability: SpotAvailability }[] {
  return spots
    .map((spot) => ({ spot, availability: spotAvailability(spot, at) }))
    .filter(({ availability }) => availability.status === '열림')
    .sort((a, b) => {
      // 근거가 튼튼한 자리를 먼저 보여준다
      const byEvidence =
        evidenceWeight(b.spot.evidence.level) - evidenceWeight(a.spot.evidence.level);
      if (byEvidence !== 0) return byEvidence;
      // 그다음은 실내를 우선 (앉을 수 있고 날씨 영향이 없다)
      return a.availability.placement === '실내' ? -1 : 1;
    });
}
