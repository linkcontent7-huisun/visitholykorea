/**
 * 인근 혼잡도 산식 (2026-09-16 재설계).
 *
 * 한국관광공사 TourAPI 에는 실시간 혼잡도가 없다. 관광지 집중률 예측을
 * 성지 이름 또는 같은 시·군·구 관광지들의 값으로 "인근" 근거로 쓴다.
 *
 * 예전 산식의 "주변 명소·식당 개수" 축은 뺐다 — 시설 수는 사람 수의 근거가 못 된다.
 * 집중률이 없는 시·군·구(광주·전남 등)에서는 **등급을 내지 않는다.**
 *
 * 화면 규칙(사장님 2026-09-16): 등급은 세 단계뿐이고, 퍼센트·점수·건수 같은 숫자는 화면에 내지
 * 않는다. 그래서 근거는 문장 키(`ReasonItem`)로 돌려주고 숫자는 내부(`score`)에만 둔다.
 *
 * 이 파일에는 API 호출이 없다. 순수 계산만 있어서 테스트로 고정한다. 조회는 `congestion-lookup.ts`.
 */

import type { CongestionRate } from '@/shared/api/tour-api';
import type { TranslationKey } from '@/shared/i18n/dictionary';
import { isSameSpot } from '../lib/name-match';

// ---------------------------------------------------------------------------
// 상수 — 발표자료에 그대로 공개할 값들
// ---------------------------------------------------------------------------

/** 등급 경계. 이 미만이 조용, 다음 미만이 보통, 그 이상이 붐빔. */
export const LEVEL_BOUNDS = { quietBelow: 30, moderateBelow: 60 } as const;

export const CROWDING_LEVELS = ['조용', '보통', '붐빔'] as const;
export type CrowdingLevel = (typeof CROWDING_LEVELS)[number];

/** 점수(0~100) → 세 단계. 경계값은 낮은 쪽(더 조용한 쪽)에 포함되지 않는다. */
export function toCrowdingLevel(score: number): CrowdingLevel {
  if (score < LEVEL_BOUNDS.quietBelow) return '조용';
  if (score < LEVEL_BOUNDS.moderateBelow) return '보통';
  return '붐빔';
}

// ---------------------------------------------------------------------------
// 관광공사 집중률
// ---------------------------------------------------------------------------

export interface CongestionSignal {
  /** site = 성지 이름이 관광지로 등재돼 있어 그 값. district = 같은 시·군·구 관광지들의 중앙값 */
  kind: 'site' | 'district';
  /** kind=site 일 때 매칭된 관광지 이름 */
  name: string | null;
  /** 시·군·구 이름 (응답의 signguNm) */
  district: string;
  /** 0~100 (내부용) */
  rate: number;
  level: CrowdingLevel;
  /** 그날 그 시·군·구에 등재된 관광지 수 (내부용) */
  count: number;
  /** YYYYMMDD — 어느 날의 예측인지 */
  baseYmd: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function clampRate(value: string): number {
  return Math.max(0, Math.min(100, Number(value)));
}

/**
 * 시·군·구 집중률 응답에서 이 성지에 붙일 신호를 고른다.
 *
 * 응답은 **오늘부터** 30일치가 섞여 온다. 예전 코드는 `max(baseYmd)` 를 "최신"으로 골라 30일 뒤
 * 예측을 오늘 값처럼 썼다. 지금은 가장 이른 날(=오늘)만 쓴다.
 * ① 성지 이름이 관광지 이름과 맞으면 그 값(kind=site) ② 아니면 그날 관광지들의 중앙값(kind=district).
 * 최댓값은 쓰지 않는다 — 2026-09-14 감사에서 과대추정으로 판명. ③ 행이 없으면 null.
 */
export function pickCongestion(
  siteName: string,
  rates: readonly CongestionRate[],
): CongestionSignal | null {
  const valid = rates.filter((r) => r.baseYmd && Number.isFinite(Number(r.cnctrRate)));
  if (valid.length === 0) return null;

  const today = valid.reduce((min, r) => (r.baseYmd < min ? r.baseYmd : min), valid[0]!.baseYmd);
  const rows = valid.filter((r) => r.baseYmd === today);
  const district = rows[0]?.signguNm ?? '';

  const matched = rows.find((r) => isSameSpot(siteName, r.tAtsNm));
  if (matched) {
    const rate = clampRate(matched.cnctrRate);
    return {
      kind: 'site',
      name: matched.tAtsNm,
      district,
      rate,
      level: toCrowdingLevel(rate),
      count: rows.length,
      baseYmd: today,
    };
  }

  const rate = median(rows.map((r) => clampRate(r.cnctrRate)));
  return {
    kind: 'district',
    name: null,
    district,
    rate,
    level: toCrowdingLevel(rate),
    count: rows.length,
    baseYmd: today,
  };
}

// ---------------------------------------------------------------------------
// 합산 · 근거
// ---------------------------------------------------------------------------

/** 화면이 그대로 번역해 쓰는 근거 한 줄. 숫자는 넣지 않는다 — `level` 은 「낮음·보통·높음」 말로 바뀐다. */
export interface ReasonItem {
  key: TranslationKey;
  params?: Record<string, string>;
  level?: CrowdingLevel;
}

export interface NearbyCrowding {
  /** null = 집중률이 없는 시·군·구 → 등급을 내지 않는다 */
  level: CrowdingLevel | null;
  /** 0~100, 내부·테스트용. 화면에 내지 않는다 */
  score: number | null;
  congestion: CongestionSignal | null;
  reasons: ReasonItem[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 관광공사 집중률로 인근 혼잡도를 만든다. 데이터가 없으면 등급 없이 근거만 남긴다. */
export function combineNearbyCrowding(congestion: CongestionSignal | null): NearbyCrowding {
  const reasons: ReasonItem[] = [];

  if (congestion?.kind === 'site') {
    reasons.push({ key: 'crowdingReasonSite', level: congestion.level });
  } else if (congestion) {
    reasons.push({
      key: 'crowdingReasonDistrict',
      params: { district: congestion.district },
      level: congestion.level,
    });
  } else {
    reasons.push({ key: 'crowdingReasonNoData' });
  }

  if (!congestion) return { level: null, score: null, congestion: null, reasons };

  const score = round(congestion.rate);
  return { level: toCrowdingLevel(score), score, congestion, reasons };
}
