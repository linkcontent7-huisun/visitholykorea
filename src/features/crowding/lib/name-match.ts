/**
 * 관광공사 집중률의 관광지 이름(`tAtsNm`)과 우리 이름(성지명 · 관광지 제목)을 맞추는 규칙.
 *
 * 집중률 응답에는 좌표가 없다(2026-09-15 실측). 그래서 이름으로만 맞출 수 있고,
 * 오매칭이 더 해로우므로 규칙을 좁게 둔다: 정확히 같거나, **3자 이상**인 쪽이 다른 쪽에
 * 포함될 때만 같은 곳으로 본다. 2자("서울" ⊂ "서울숲")는 포함 매칭을 안 한다.
 */

/** 공백·괄호 안 내용을 걷어낸다. "경복궁(서울)" 과 "경복궁", "솔뫼 성지" 와 "솔뫼성지" 가 같아야 한다. */
export function normalizeName(name: string): string {
  return name
    .replace(/\([^)]*\)/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export function isSameSpot(a: string, b: string): boolean {
  const x = normalizeName(a);
  const y = normalizeName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const shorter = x.length <= y.length ? x : y;
  const longer = shorter === x ? y : x;
  return shorter.length >= 3 && longer.includes(shorter);
}
