/**
 * 오후 관광지 고르기 — 성지 5km 안 볼거리 중 **덜 붐비는 곳**을 앞에 둔다.
 *
 * 붐빔의 근거는 한국관광공사 「관광지 집중률 예측」(관광지 이름별 0~100). 관광지에는 이게
 * 맞는 데이터다. 집중률이 있는 곳끼리는 낮은 순, 없는 곳은 그 뒤에 가까운 순 —
 * 즉 같은 거리면 덜 붐비는 곳. 붐빌 예정(70 이상)이면 화면이 한 줄 더 알린다.
 *
 * 순수 함수 — 스펙 8-2 절. 집중률 조회 자체는 `quiet-sites.ts` 가 한다.
 */

import type { CongestionRate, TourApiSpot } from '@/shared/api/tour-api';
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

/** 이름 비교용 — 공백·괄호 안 내용을 걷어낸다. "경복궁(서울)" 과 "경복궁" 이 같아야 한다. */
function normalizeName(name: string): string {
  return name.replace(/\([^)]*\)/g, '').replace(/\s+/g, '').trim();
}

/** 응답의 여러 날짜 중 가장 최근 날짜 행만 남긴다 — 예전엔 날짜를 안 보고 최댓값을 골라 과대추정했다. */
function latestRates(rates: readonly CongestionRate[]): CongestionRate[] {
  const latest = rates.reduce((max, r) => (r.baseYmd > max ? r.baseYmd : max), '');
  return rates.filter((r) => r.baseYmd === latest && Number.isFinite(Number(r.cnctrRate)));
}

/**
 * 관광지 제목 ↔ 집중률 관광지명(tAtsNm). 정확히 같거나, 3자 이상인 쪽이 다른 쪽에 포함되면 같은 곳으로 본다.
 * 2자("서울" ⊂ "서울숲")는 포함 매칭을 안 한다 — 오매칭이 더 해롭다.
 */
export function matchCongestion(title: string, rates: readonly CongestionRate[]): number | null {
  const key = normalizeName(title);
  if (!key) return null;
  const hit = latestRates(rates).find((r) => {
    const name = normalizeName(r.tAtsNm);
    if (!name) return false;
    if (name === key) return true;
    const shorter = name.length <= key.length ? name : key;
    const longer = shorter === name ? key : name;
    return shorter.length >= 3 && longer.includes(shorter);
  });
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
