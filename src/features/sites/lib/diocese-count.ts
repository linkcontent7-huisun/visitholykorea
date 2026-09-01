/**
 * 교구별 성지 수 집계.
 *
 * 탐색 화면의 교구 카드에 "25곳" 처럼 붙인다. 숫자가 없으면 어느 교구를
 * 눌러야 할지 판단할 근거가 없고, 카드가 아이콘과 이름뿐이라 비어 보인다.
 */

/** 교구가 비어 있는 성지는 세지 않는다 — 어느 칸에 넣을지 알 수 없다. */
export function countByDiocese(
  sites: { id: string; diocese: string | null }[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const site of sites) {
    const key = site.diocese?.trim();
    if (!key) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
