/**
 * 주소록(본당·공소) 검색어 다듬기와 순위 (2026-11-02 사장님 지적 「성지만 검색된다」).
 *
 * 사람들은 「서귀포성당」「명동성당」처럼 치는데, 주교회의 주소록 이름은 「서귀포」「천호동(지)」
 * 「답동 주교좌」처럼 「성당」 없이 저장돼 있다(본당 1,789곳 중 「성당」으로 끝나는 곳 4곳, 11/2 실측).
 * 그래서 「…성당」으로 치면 0건이었다. 검색어 끝의 꼬리말을 떼고, 이름이 정확히 같은 곳을 맨 앞에 둔다.
 */

const TAIL = /(주교좌\s*대?성당|대성당|성당|본당|공소|교회)$/;

/** 검색어에서 꼬리말(성당·본당·공소…)과 공백을 뗀 핵심 — 떼고 나서 비면 원래 말을 쓴다. */
export function directoryCoreTerm(term: string): string {
  const compact = term.trim().replace(/\s+/g, '');
  const core = compact.replace(TAIL, '');
  return core || compact;
}

/** 주소록 이름에서 꼬리표 「(지)」「주교좌」와 공백을 뗀다 — 순위를 매길 때만 쓴다. */
function bareName(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .replace(/주교좌/g, '')
    .replace(/\s+/g, '');
}

/** 0: 이름이 같음 · 1: 이름이 그 말로 시작 · 2: 이름에 들어 있음 · 3: 주소·교구에만 있음 */
export function directoryMatchRank(name: string, core: string): number {
  const bare = bareName(name);
  if (bare === core) return 0;
  if (bare.startsWith(core)) return 1;
  if (bare.includes(core)) return 2;
  return 3;
}

export function rankDirectoryResults<T extends { name: string }>(
  rows: T[],
  term: string,
  limit: number,
): T[] {
  const core = directoryCoreTerm(term);
  return rows
    .map((row, index) => ({ row, index, rank: directoryMatchRank(row.name, core) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((x) => x.row);
}
