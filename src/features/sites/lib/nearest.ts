import { driveMinutes, haversineKm } from '@/shared/lib/geo';
import type { HolySite } from '@/shared/types/domain';

/** 출발지 기준 거리·차량 시간이 붙은 성지. */
export interface SiteWithDistance {
  site: HolySite;
  km: number;
  driveMin: number;
}

/**
 * 성지 목록을 출발지에서 가까운 순으로 정렬하고 거리·소요 시간을 붙인다.
 *
 * 수요조사 자유의견 1호 — "내 위치부터 소요시간별로 순서대로 정리되면
 * 좋을듯합니다" — 를 구현하는 계산부. 좌표가 없는 성지는 거리를 잴 수 없으니
 * 원래 순서 그대로 목록 끝에 붙인다. 정렬에서 조용히 사라지게 두면
 * "교구 성지 수와 목록 수가 다른" 미스터리가 생긴다.
 */
export function sortByDistance(
  sites: HolySite[],
  from: { lat: number; lng: number },
): { measured: SiteWithDistance[]; unmeasured: HolySite[] } {
  const measured: SiteWithDistance[] = [];
  const unmeasured: HolySite[] = [];

  for (const site of sites) {
    const { lat, lng } = site.coordinates;
    if (lat == null || lng == null) {
      unmeasured.push(site);
      continue;
    }
    const km = haversineKm(from.lat, from.lng, lat, lng);
    measured.push({ site, km, driveMin: driveMinutes(km) });
  }

  measured.sort((a, b) => a.km - b.km);
  return { measured, unmeasured };
}
