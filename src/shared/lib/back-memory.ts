/**
 * 「뒤로 가기」 기억 (사장님 지적 2026-11-25).
 *
 * 1) 성지 찾기에서 검색 → 성지 상세를 본 뒤 뒤로 오면 검색 화면이 그대로여야 한다. 검색어·목록 스크롤은 메모리(Map)에
 *    두어 왔는데, 상세 화면에서 새로고침하거나 폰이 탭을 비우면 메모리가 사라져 «성지 찾기 처음»으로 돌아왔다.
 *    → 같은 값을 sessionStorage 에도 둔다. 키는 라우터가 기록 한 칸마다 주는 `location.key`(새로고침해도 그 칸의 값은 그대로).
 * 2) 상세 화면을 주소로 바로 열었거나(공유 링크·새 탭) 이 사이트 안에 앞선 화면이 없으면 «뒤로»가 사이트 밖으로 나갔다.
 *    → 앞선 화면이 없으면 홈으로 보낸다. 라우터는 기록 칸마다 순번(idx)을 `history.state` 에 적는다(첫 칸 0).
 */
const KEY = 'vhk.backMemory';
const MAX = 30;

type Mem = Record<string, { q?: string; s?: number }>;

function read(): Mem {
  try {
    const v = JSON.parse(window.sessionStorage.getItem(KEY) ?? '{}') as Mem;
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
function write(m: Mem) {
  try {
    const keys = Object.keys(m);
    for (const k of keys.slice(0, Math.max(0, keys.length - MAX))) delete m[k]; // 오래된 것부터 버린다
    window.sessionStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    /* 저장소가 막혀 있어도 메모리 기억은 그대로 동작한다 */
  }
}

export function rememberQuery(locationKey: string, query: string) {
  const m = read();
  m[locationKey] = { ...m[locationKey], q: query };
  write(m);
}
export function recallQuery(locationKey: string): string | undefined {
  return read()[locationKey]?.q;
}
export function rememberScroll(locationKey: string, top: number) {
  const m = read();
  m[locationKey] = { ...m[locationKey], s: top };
  write(m);
}
export function recallScroll(locationKey: string): number | undefined {
  return read()[locationKey]?.s;
}

/** 이 사이트 안에 «뒤로 갈 앞선 화면»이 있는가 — 없으면 뒤로 가기는 사이트 밖으로 나간다 */
export function hasPreviousInApp(): boolean {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  return typeof idx === 'number' && idx > 0;
}
