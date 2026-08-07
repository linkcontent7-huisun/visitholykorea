/**
 * "가 봤다" 표시.
 *
 * 정식 기록은 `pilgrimage_stamps`(순례 여권)이지만 그건 **로그인이 필요하다.**
 * 지도를 처음 연 사람에게 로그인부터 요구하면 채워보고 싶은 마음이 생기기도 전에 나간다.
 * 그래서 로그인 없이도 기기에 표시할 수 있게 두고, 로그인한 사용자는 서버 스탬프와 합쳐 본다.
 *
 * **날짜를 함께 남긴다.** 여정선이 시간순으로 이어지고 최근일수록 진해지려면
 * 순서를 알아야 한다. id 만 저장하면 그 순서를 되살릴 방법이 없다.
 *
 * **아직 정하지 않은 것** — 로그인했을 때 기기 표시를 서버로 올려 줄지, 올린다면
 * 언제 물어볼지는 결정하지 않았다. 지금은 합쳐서 보여주기만 한다.
 * 지우는 쪽도 기기 표시만 지운다(서버 스탬프를 조용히 지우면 안 된다).
 */

import type { VisitRecord } from '../lib/journey';

const STORAGE_KEY = 'visitholykorea.visited';

/**
 * 저장된 값을 읽는다.
 *
 * 예전에는 id 배열(`["a","b"]`)로 저장했다. 그 형식도 계속 읽되 **날짜는 지어내지 않는다** —
 * `visitedAt: null` 로 두면 여정선에서 가장 오래된 쪽으로 밀려난다.
 */
function safeRead(): VisitRecord[] {
  let parsed: unknown;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const records: VisitRecord[] = [];
  for (const entry of parsed) {
    // 옛 형식 — id 문자열만
    if (typeof entry === 'string') {
      records.push({ siteId: entry, visitedAt: null });
      continue;
    }
    if (typeof entry === 'object' && entry !== null) {
      const { siteId, visitedAt } = entry as Partial<VisitRecord>;
      if (typeof siteId === 'string' && siteId !== '') {
        records.push({ siteId, visitedAt: typeof visitedAt === 'string' ? visitedAt : null });
      }
    }
  }
  return records;
}

function safeWrite(records: VisitRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 저장이 안 되면 이번 세션에만 남는다. 막을 방법이 없으니 조용히 넘어간다.
  }
}

export function readLocalVisits(): VisitRecord[] {
  return safeRead();
}

/** 표시를 켜고 끈다. 바뀐 뒤의 기록을 돌려준다. */
export function toggleLocalVisit(siteId: string): VisitRecord[] {
  const records = safeRead();
  const at = records.findIndex((r) => r.siteId === siteId);

  const next =
    at === -1
      ? [...records, { siteId, visitedAt: new Date().toISOString() }]
      : records.filter((r) => r.siteId !== siteId);

  safeWrite(next);
  return next;
}

export function clearLocalVisits(): void {
  safeWrite([]);
}
