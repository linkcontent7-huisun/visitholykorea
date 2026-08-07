/**
 * 다녀온 성지.
 *
 * 서버 스탬프(로그인 필요)와 기기 표시(로그인 불필요)를 합쳐 준다.
 * `getMyStamps()` 는 로그인이 없거나 조회에 실패하면 빈 배열을 주므로,
 * 로그인 전이나 표가 아직 없는 동안에도 기기 표시만으로 지도가 동작한다.
 */

import { useCallback, useMemo, useState } from 'react';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { readLocalVisits, toggleLocalVisit } from '../api/visited';
import type { VisitRecord } from '../lib/journey';

export function useVisitedSites() {
  const { data: stamps = [] } = useMyStamps();
  const [local, setLocal] = useState<VisitRecord[]>(() => readLocalVisits());

  /** 같은 성지가 양쪽에 있으면 서버 기록을 남긴다 — 기기 표시보다 정확하다. */
  const visits = useMemo(() => {
    const byId = new Map<string, VisitRecord>();
    for (const r of local) byId.set(r.siteId, r);
    for (const s of stamps) byId.set(s.siteId, { siteId: s.siteId, visitedAt: s.visitedAt });
    return [...byId.values()];
  }, [local, stamps]);

  const visitedIds = useMemo(() => new Set(visits.map((v) => v.siteId)), [visits]);

  const toggle = useCallback((siteId: string) => {
    setLocal(toggleLocalVisit(siteId));
  }, []);

  /** 서버 스탬프는 여기서 지우지 않는다 — 기기 표시만 끌 수 있다. */
  const isServerStamped = useCallback(
    (siteId: string) => stamps.some((s) => s.siteId === siteId),
    [stamps],
  );

  return { visits, visitedIds, toggle, isServerStamped };
}
