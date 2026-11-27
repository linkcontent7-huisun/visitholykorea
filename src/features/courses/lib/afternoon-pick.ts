/**
 * 오후 관광지 고르기 — 성지 5km 안 볼거리를 **가까운 순**으로.
 *
 * 예전에는 한국관광공사 「관광지 집중률 예측」으로 덜 붐비는 곳을 앞에 두었다. 공모전이 끝나
 * 붐빔 지수를 재지도 보이지도 않기로 해(사장님 2026-11-27) 거리만 본다.
 *
 * 순수 함수 — 스펙 8-2 절.
 */

import type { TourApiSpot } from '@/shared/api/tour-api';
import { CATHOLIC_TITLE } from '../api/course-matching';

export interface AfternoonPick {
  spot: TourApiSpot;
}

function distanceOf(spot: TourApiSpot): number {
  const d = Number(spot.dist);
  return Number.isFinite(d) ? d : Number.POSITIVE_INFINITY;
}

/**
 * 볼거리 후보 → 오후 후보 순서(가까운 순).
 * 가톨릭 시설은 뺀다 — "성지에서 시작해 오후에 또 성지"가 되지 않게.
 */
export function rankAfternoon(spots: readonly TourApiSpot[]): AfternoonPick[] {
  return spots
    .filter((s) => !CATHOLIC_TITLE.test(s.title))
    .map((spot) => ({ spot }))
    .sort((a, b) => distanceOf(a.spot) - distanceOf(b.spot));
}
