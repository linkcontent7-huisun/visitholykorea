/**
 * 인근 혼잡도 산식 (2026-09-16 재설계).
 *
 * 한국관광공사 TourAPI 에는 실시간 혼잡도가 없다. 대신 두 가지가 있다.
 *   ① 관광지 집중률 예측 — 관광지 **이름**별 0~100, 오늘부터 30일. 성지 32곳은 이름으로 올라 있고
 *      나머지는 같은 시·군·구 관광지들의 값을 "인근" 근거로 쓴다.
 *   ② 오늘 열리는 축제·행사 — 성지 반경 15km 안의 거리 가중 합.
 *
 * 예전 산식의 "주변 명소·식당 개수" 축은 뺐다 — 시설 수는 사람 수의 근거가 못 된다.
 * 집중률이 없는 시·군·구(광주·전남 등)에서는 **등급을 내지 않는다.** 축제 0건을 "조용"으로
 * 읽는 것이 가장 흔한 거짓말이었다.
 *
 * 화면 규칙(사장님 2026-09-16): 등급은 세 단계뿐이고, 퍼센트·점수·건수 같은 숫자는 화면에 내지
 * 않는다. 그래서 근거는 문장 키(`ReasonItem`)로 돌려주고 숫자는 내부(`score`)에만 둔다.
 *
 * 이 파일에는 API 호출이 없다. 순수 계산만 있어서 테스트로 고정한다. 조회는 `congestion-lookup.ts`.
 */

import type { CongestionRate, TourApiSpot } from '@/shared/api/tour-api';
import type { TranslationKey } from '@/shared/i18n/dictionary';
import { haversineKm } from '@/shared/lib/geo';
import type { Coordinates } from '@/shared/types/domain';
import { isSameSpot } from '../lib/name-match';

// ---------------------------------------------------------------------------
// 상수 — 발표자료에 그대로 공개할 값들
// ---------------------------------------------------------------------------

/** 축제는 광역에서 사람을 끌어오므로 넓게 본다(km). 이 밖은 그날의 붐빔에 영향을 주지 않는다고 본다. */
export const FESTIVAL_RADIUS_KM = 15;
/** 포화 상수. 가까운 축제 1개면 이미 63% 에 닿는다. */
export const FESTIVAL_SATURATION = 1;
/** 두 신호의 가중치. 집중률이 관광지 단위 예측이라 더 무겁다. 실측 대조 뒤 조정할 값. */
export const WEIGHT = { congestion: 0.7, festival: 0.3 } as const;
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

/**
 * 포화 곡선: `max * (1 - e^(-value/k))`.
 * 처음 몇 개가 크게 올리고, 이미 붐비는 곳에서는 몇 개 더 늘어도 체감이 작다는 성질. 상한을 넘지 않는다.
 */
export function saturate(value: number, max: number, k: number): number {
  if (value <= 0) return 0;
  return max * (1 - Math.exp(-value / k));
}

// ---------------------------------------------------------------------------
// 신호 ① 축제 압력
// ---------------------------------------------------------------------------

export interface FestivalPressure {
  /** 0~100 */
  score: number;
  /** 반경 안에 있는 행사 수 (내부용 — 화면에 내지 않는다) */
  count: number;
  /** 가장 가까운 행사 (반경 밖이라도 참고용) */
  nearest: { title: string; distanceKm: number } | null;
}

/** 오늘 열리는 행사들과의 거리로 축제 압력을 낸다. 가까울수록 크고(선형 감쇠), 여러 개면 합산 뒤 포화. */
export function festivalPressure(site: Coordinates, festivals: readonly TourApiSpot[]): FestivalPressure {
  const { lat, lng } = site;
  if (lat == null || lng == null) return { score: 0, count: 0, nearest: null };

  let weightSum = 0;
  let count = 0;
  let nearest: FestivalPressure['nearest'] = null;

  for (const festival of festivals) {
    const fLat = Number(festival.mapy);
    const fLng = Number(festival.mapx);
    if (!Number.isFinite(fLat) || !Number.isFinite(fLng) || fLat === 0 || fLng === 0) continue;

    const distanceKm = haversineKm(lat, lng, fLat, fLng);
    if (!nearest || distanceKm < nearest.distanceKm) nearest = { title: festival.title, distanceKm };

    if (distanceKm <= FESTIVAL_RADIUS_KM) {
      count += 1;
      weightSum += 1 - distanceKm / FESTIVAL_RADIUS_KM;
    }
  }

  return { score: saturate(weightSum, 100, FESTIVAL_SATURATION), count, nearest };
}

// ---------------------------------------------------------------------------
// 신호 ② 관광공사 집중률
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
export function pickCongestion(siteName: string, rates: readonly CongestionRate[]): CongestionSignal | null {
  const valid = rates.filter((r) => r.baseYmd && Number.isFinite(Number(r.cnctrRate)));
  if (valid.length === 0) return null;

  const today = valid.reduce((min, r) => (r.baseYmd < min ? r.baseYmd : min), valid[0]!.baseYmd);
  const rows = valid.filter((r) => r.baseYmd === today);
  const district = rows[0]?.signguNm ?? '';

  const matched = rows.find((r) => isSameSpot(siteName, r.tAtsNm));
  if (matched) {
    const rate = clampRate(matched.cnctrRate);
    return { kind: 'site', name: matched.tAtsNm, district, rate, level: toCrowdingLevel(rate), count: rows.length, baseYmd: today };
  }

  const rate = median(rows.map((r) => clampRate(r.cnctrRate)));
  return { kind: 'district', name: null, district, rate, level: toCrowdingLevel(rate), count: rows.length, baseYmd: today };
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
  festival: FestivalPressure;
  reasons: ReasonItem[];
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 두 신호를 합쳐 인근 혼잡도를 만든다. 집중률이 없으면 등급 없이 근거만 남긴다. */
export function combineNearbyCrowding(
  festival: FestivalPressure,
  congestion: CongestionSignal | null,
): NearbyCrowding {
  const reasons: ReasonItem[] = [];

  if (congestion?.kind === 'site') {
    reasons.push({ key: 'crowdingReasonSite', level: congestion.level });
  } else if (congestion) {
    reasons.push({ key: 'crowdingReasonDistrict', params: { district: congestion.district }, level: congestion.level });
  } else {
    reasons.push({ key: 'crowdingReasonNoData' });
  }

  if (festival.count > 0 && festival.nearest) {
    reasons.push({ key: 'crowdingReasonFestivalYes', params: { title: festival.nearest.title } });
  } else {
    reasons.push({ key: 'crowdingReasonFestivalNo' });
  }

  if (!congestion) return { level: null, score: null, congestion: null, festival, reasons };

  const score = round(congestion.rate * WEIGHT.congestion + festival.score * WEIGHT.festival);
  return { level: toCrowdingLevel(score), score, congestion, festival, reasons };
}
