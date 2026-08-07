/**
 * 다녀온 성지 집합.
 *
 * 서버 스탬프(로그인 필요)와 기기 표시(로그인 불필요)를 합쳐 준다.
 * `getMyStamps()` 는 로그인이 없거나 조회에 실패하면 빈 배열을 주므로,
 * 로그인 전이나 표가 아직 없는 동안에도 기기 표시만으로 지도가 동작한다.
 */

import { useCallback, useMemo, useState } from 'react';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { readLocalVisited, toggleLocalVisited } from '../api/visited';

export function useVisitedSites() {
  const { data: stamps = [] } = useMyStamps();
  const [local, setLocal] = useState<Set<string>>(() => readLocalVisited());

  const visitedIds = useMemo(() => {
    const merged = new Set(local);
    for (const stamp of stamps) merged.add(stamp.siteId);
    return merged;
  }, [local, stamps]);

  const toggle = useCallback((siteId: string) => {
    setLocal(toggleLocalVisited(siteId));
  }, []);

  /** 서버 스탬프는 여기서 지우지 않는다 — 기기 표시만 끌 수 있다. */
  const isServerStamped = useCallback(
    (siteId: string) => stamps.some((s) => s.siteId === siteId),
    [stamps],
  );

  return { visitedIds, toggle, isServerStamped };
}
