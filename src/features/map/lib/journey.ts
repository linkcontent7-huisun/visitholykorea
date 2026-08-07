/**
 * 순례 여정선 — 다녀온 성지를 시간순으로 잇는다.
 *
 * 산티아고 순례길은 **정해진 길**을 걷는다. 우리는 각자 다른 길을 그린다.
 * 흩어져 있다는 약점이 여기서는 강점이 된다 — 같은 그림이 두 번 나오지 않는다.
 *
 * 선은 **최근일수록 진하다.** 지금 어디쯤 와 있는지가 먼저 보여야 하고,
 * 오래된 여정은 배경으로 물러나되 사라지지는 않아야 한다.
 * 직선으로 잇는다 — 실제로 그 경로로 이동했다고 주장하지 않기 위해서다.
 */

export interface VisitRecord {
  siteId: string;
  /**
   * 다녀온 시각(ISO). 날짜를 모르는 기록은 null.
   * 옛 저장 형식에서 옮겨온 것들이 여기 해당한다 — 지어내지 않고 모른다고 둔다.
   */
  visitedAt: string | null;
}

export const JOURNEY = {
  /**
   * 가장 오래된 선의 투명도.
   * 0 으로 두면 초기 여정이 아예 사라져 "내가 그린 길"이 잘려 보인다.
   */
  minOpacity: 0.18,
} as const;

/**
 * 시간순 정렬. 날짜를 모르는 기록은 **가장 앞(오래된 쪽)** 에 둔다.
 * 뒤에 두면 모르는 기록이 가장 최근인 척하게 되고, 그게 선의 끝을 엉뚱하게 만든다.
 */
export function orderVisitsByDate(records: readonly VisitRecord[]): VisitRecord[] {
  return [...records].sort((a, b) => {
    if (a.visitedAt === null && b.visitedAt === null) return 0;
    if (a.visitedAt === null) return -1;
    if (b.visitedAt === null) return 1;
    return a.visitedAt.localeCompare(b.visitedAt);
  });
}

/**
 * 구간 하나의 투명도.
 * `index` 는 0 이 가장 오래된 구간, `total - 1` 이 가장 최근 구간이다.
 */
export function segmentOpacity(index: number, total: number): number {
  if (total <= 1) return 1;
  const t = index / (total - 1);
  return JOURNEY.minOpacity + (1 - JOURNEY.minOpacity) * t;
}

export interface JourneySegment {
  fromId: string;
  toId: string;
  /** 0 이 가장 오래된 구간 */
  order: number;
  opacity: number;
}

/**
 * 이어야 할 구간 목록.
 *
 * 좌표를 여기서 다루지 않는다 — 순서와 진하기만 정하고, 화면에 놓는 일은 컴포넌트가 한다.
 * 그래야 이 규칙을 지도 없이도 시험할 수 있다.
 */
export function buildJourneySegments(records: readonly VisitRecord[]): JourneySegment[] {
  const ordered = orderVisitsByDate(records);
  if (ordered.length < 2) return [];

  const total = ordered.length - 1;
  const segments: JourneySegment[] = [];

  for (let i = 0; i < total; i += 1) {
    const from = ordered[i];
    const to = ordered[i + 1];
    if (!from || !to) continue;
    // 같은 성지를 연달아 표시한 경우 선을 그릴 것이 없다
    if (from.siteId === to.siteId) continue;

    segments.push({
      fromId: from.siteId,
      toId: to.siteId,
      order: i,
      opacity: segmentOpacity(i, total),
    });
  }

  return segments;
}
