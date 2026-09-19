/**
 * 오후 관광지 고르기 — 성지 5km 안 볼거리 중 **덜 붐비는 곳**을 앞에 둔다.
 *
 * 붐빔의 근거는 한국관광공사 「관광지 집중률 예측」(관광지 이름별 0~100). 관광지에는 이게
 * 맞는 데이터다. 집중률이 있는 곳끼리는 낮은 순, 없는 곳은 그 뒤에 가까운 순 —
 * 즉 같은 거리면 덜 붐비는 곳. 붐빌 예정(70 이상)이면 화면이 한 줄 더 알린다.
 *
 * 순수 함수 — 스펙 8-2 절. 집중률 조회 자체는 `crowding/api/congestion-lookup.ts` 가 한다.
 */

import type { CongestionRate, TourApiSpot } from '@/shared/api/tour-api';
import { isSameSpot, normalizeName } from '@/features/crowding/lib/name-match';
import { CATHOLIC_TITLE } from '../api/course-matching';

/** 집중률 등급 경계. 사장님이 조정할 값 — 스펙 19절. */
export const CONGESTION_BUSY = 70;
export const CONGESTION_MODERATE = 40;

export type CongestionLevel = 'easy' | 'moderate' | 'busy';

export interface AfternoonPick {
  spot: TourApiSpot;
  /** 관광공사 예측 집중률. 이름이 매칭되지 않으면 null — 화면은 숫자 자리를 비운다 */
  congestion: number | null;
  level: CongestionLevel | null;
}

export function toCongestionLevel(rate: number): CongestionLevel {
  if (rate >= CONGESTION_BUSY) return 'busy';
  if (rate >= CONGESTION_MODERATE) return 'moderate';
  return 'easy';
}

/**
 * 응답은 **오늘부터** 30일치가 섞여 온다 — 가장 이른 날(=오늘) 행만 남긴다.
 * 예전엔 `max(baseYmd)` 를 골라 30일 뒤 예측을 오늘 값처럼 썼다(2026-09-16 발견).
 */
function todayRates(rates: readonly CongestionRate[]): CongestionRate[] {
  const valid = rates.filter((r) => r.baseYmd && Number.isFinite(Number(r.cnctrRate)));
  if (valid.length === 0) return [];
  const today = valid.reduce((min, r) => (r.baseYmd < min ? r.baseYmd : min), valid[0]!.baseYmd);
  return valid.filter((r) => r.baseYmd === today);
}

/** 관광지 제목 ↔ 집중률 관광지명(tAtsNm). 규칙은 `name-match.ts`(성지 매칭과 같다). */
export function matchCongestion(title: string, rates: readonly CongestionRate[]): number | null {
  if (!normalizeName(title)) return null;
  const hit = todayRates(rates).find((r) => isSameSpot(title, r.tAtsNm));
  return hit ? Math.max(0, Math.min(100, Number(hit.cnctrRate))) : null;
}

function distanceOf(spot: TourApiSpot): number {
  const d = Number(spot.dist);
  return Number.isFinite(d) ? d : Number.POSITIVE_INFINITY;
}

/**
 * 볼거리 후보 → 오후 후보 순서. `rates` 가 비어 있으면 그냥 가까운 순이다.
 * 가톨릭 시설은 뺀다 — "성지에서 시작해 오후에 또 성지"가 되지 않게.
 */
export function rankAfternoon(
  spots: readonly TourApiSpot[],
  rates: readonly CongestionRate[] = [],
): AfternoonPick[] {
  return spots
    .filter((s) => !CATHOLIC_TITLE.test(s.title))
    .map((spot) => {
      const congestion = rates.length ? matchCongestion(spot.title, rates) : null;
      return { spot, congestion, level: congestion == null ? null : toCongestionLevel(congestion) };
    })
    .sort((a, b) => {
      if (a.congestion != null && b.congestion != null) return a.congestion - b.congestion;
      if (a.congestion != null) return -1;
      if (b.congestion != null) return 1;
      return distanceOf(a.spot) - distanceOf(b.spot);
    });
}
