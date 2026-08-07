/**
 * "가 봤다" 표시.
 *
 * 정식 기록은 `pilgrimage_stamps`(순례 여권)이지만 그건 **로그인이 필요하다.**
 * 지도를 처음 연 사람에게 로그인부터 요구하면 채워보고 싶은 마음이 생기기도 전에 나간다.
 * 그래서 로그인 없이도 기기에 표시할 수 있게 두고, 로그인한 사용자는 서버 스탬프와 합쳐 본다.
 *
 * **아직 정하지 않은 것** — 로그인했을 때 기기 표시를 서버로 올려 줄지, 올린다면
 * 언제 물어볼지는 결정하지 않았다. 지금은 합쳐서 보여주기만 한다.
 * 지우는 쪽도 기기 표시만 지운다(서버 스탬프를 조용히 지우면 안 된다).
 */

const STORAGE_KEY = 'visitholykorea.visited';

/** localStorage 가 막힌 환경(사파리 프라이빗 등)에서도 앱이 죽지 않게 한다 */
function safeRead(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function safeWrite(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // 저장이 안 되면 이번 세션에만 남는다. 막을 방법이 없으니 조용히 넘어간다.
  }
}

export function readLocalVisited(): Set<string> {
  return new Set(safeRead());
}

/** 표시를 켜고 끈다. 바뀐 뒤의 집합을 돌려준다. */
export function toggleLocalVisited(siteId: string): Set<string> {
  const ids = readLocalVisited();
  if (ids.has(siteId)) ids.delete(siteId);
  else ids.add(siteId);
  safeWrite([...ids]);
  return ids;
}

export function clearLocalVisited(): void {
  safeWrite([]);
}
