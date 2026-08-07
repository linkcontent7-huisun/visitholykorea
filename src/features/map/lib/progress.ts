/**
 * 교구별 진행 상황과 핀 상태.
 *
 * "채워보고 싶다"는 느낌은 숫자를 크게 쓴다고 생기지 않는다.
 * **거의 다 찬 교구의 남은 곳**을 눈에 띄게 하는 것이 훨씬 강하다 —
 * 목표에 가까울수록 동기가 급해지기 때문이다. 3/27 일 때 27곳을 들이대면 질리지만,
 * 26/27 이면 남은 한 곳을 보러 간다.
 *
 * 문구에 "정복·클리어·달성률" 같은 말을 쓰지 않는다. 순례는 점수 따기가 아니다.
 * 안 간 곳도 실패로 보이면 안 된다 — 흐리게 두되 부정적이지 않게.
 */

import type { HolySite } from '@/shared/types/domain';

/** 핀 하나가 가질 수 있는 상태 */
export type PinState =
  /** 다녀온 곳 — 채워진 핀 */
  | 'visited'
  /** 거의 다 찬 교구에 남은 곳 — 강조. 이게 넛지의 핵심이다 */
  | 'almost'
  /** 아직 안 간 곳 — 흐린 빈 핀 */
  | 'remaining';

export const ALMOST = {
  /** 남은 곳이 이 수 이하일 때 "거의 다 왔다"로 본다 */
  maxRemaining: 3,
  /**
   * 동시에 이 비율 이상 채워져 있어야 한다.
   * 성지가 2곳뿐인 교구에서 1곳 남은 걸 "거의 다 왔다"고 하면 말이 안 된다.
   */
  minRatio: 0.7,
} as const;

export interface DioceseProgress {
  diocese: string;
  visited: number;
  total: number;
  /** 0~1 */
  ratio: number;
  /** 거의 다 찬 교구인가 */
  almost: boolean;
  /** 아직 안 간 성지들 (거의 다 찬 교구에서만 채운다 — 나머지는 굳이 셀 필요가 없다) */
  remainingSites: HolySite[];
}

/** 성지의 교구. 도메인 타입에서는 `region` 이 교구다. */
function dioceseOf(site: HolySite): string {
  return site.region?.trim() || '기타';
}

/**
 * 교구별 진행 상황. 채워진 비율이 높은 순으로 준다 —
 * 화면 위쪽에 "거의 다 온 교구"가 오게 하려는 것이다.
 */
export function computeDioceseProgress(
  sites: HolySite[],
  visitedIds: ReadonlySet<string>,
): DioceseProgress[] {
  const buckets = new Map<string, HolySite[]>();
  for (const site of sites) {
    const key = dioceseOf(site);
    const list = buckets.get(key);
    if (list) list.push(site);
    else buckets.set(key, [site]);
  }

  const result: DioceseProgress[] = [];

  for (const [diocese, group] of buckets) {
    const remainingSites = group.filter((s) => !visitedIds.has(s.id));
    const visited = group.length - remainingSites.length;
    const ratio = group.length === 0 ? 0 : visited / group.length;

    const almost =
      remainingSites.length > 0 &&
      remainingSites.length <= ALMOST.maxRemaining &&
      ratio >= ALMOST.minRatio;

    result.push({
      diocese,
      visited,
      total: group.length,
      ratio,
      almost,
      remainingSites: almost ? remainingSites : [],
    });
  }

  return result.sort((a, b) => b.ratio - a.ratio || b.total - a.total);
}

/** 강조할 성지 id 집합 — 거의 다 찬 교구에 남은 곳들 */
export function almostSiteIds(progress: DioceseProgress[]): Set<string> {
  const ids = new Set<string>();
  for (const p of progress) {
    for (const site of p.remainingSites) ids.add(site.id);
  }
  return ids;
}

export function pinStateOf(
  siteId: string,
  visitedIds: ReadonlySet<string>,
  almostIds: ReadonlySet<string>,
): PinState {
  if (visitedIds.has(siteId)) return 'visited';
  if (almostIds.has(siteId)) return 'almost';
  return 'remaining';
}

/**
 * 넛지 한 줄. 없으면 null — 억지로 말을 걸지 않는다.
 *
 * 가장 가까이 온 교구 하나만 고른다. 여러 줄을 동시에 띄우면 어느 것도 눈에 안 들어온다.
 */
export function buildNudge(progress: DioceseProgress[]): string | null {
  const target = progress.find((p) => p.almost);
  if (!target) return null;

  const left = target.remainingSites.length;

  if (left === 1) {
    const name = target.remainingSites[0]?.name ?? '';
    return `${target.diocese}교구는 ${name} 한 곳만 남았습니다`;
  }
  return `${target.diocese}교구는 ${left}곳 남았습니다`;
}

/** 전체 요약. "208곳 중 12곳" 처럼 쓴다. */
export function totalProgress(
  sites: HolySite[],
  visitedIds: ReadonlySet<string>,
): { visited: number; total: number } {
  let visited = 0;
  for (const site of sites) if (visitedIds.has(site.id)) visited += 1;
  return { visited, total: sites.length };
}
