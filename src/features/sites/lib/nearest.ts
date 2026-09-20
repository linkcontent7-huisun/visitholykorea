import { driveMinutes, haversineKm } from '@/shared/lib/geo';
import type { HolySite } from '@/shared/types/domain';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 규칙을 적용한 날에는 기존 상위 4곳부터 시작하고, 다음 날부터 다음 순위로 넘긴다. */
const HOME_ROTATION_START_DAY = Math.floor(Date.UTC(2026, 8, 20) / DAY_MS);

/** 홈 추천은 한국 날짜가 바뀌는 시점에만 바뀌어야 하므로 날짜를 한국 시간으로 계산한다. */
export function koreaDayIndex(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type === 'year' || part.type === 'month' || part.type === 'day')
      .map((part) => [part.type, Number(part.value)]),
  );
  return Math.floor(Date.UTC(values.year!, values.month! - 1, values.day!) / DAY_MS);
}

/** 홈 추천 순환에서 규칙 적용일을 0일차로 삼는다. */
export function homeRotationDay(date: Date = new Date()): number {
  return koreaDayIndex(date) - HOME_ROTATION_START_DAY;
}

/**
 * 순위 목록을 날짜별로 다음 구간으로 넘긴다.
 * 랜덤을 쓰지 않으므로 새로고침·재진입·쿼리 재조회 시에도 같은 날짜에는 결과가 같다.
 * 마지막 구간이 4곳보다 짧으면 목록 처음으로 이어 붙여 카드 수를 유지한다.
 */
export function selectDailyRotation<T>(
  items: readonly T[],
  dayIndex: number,
  count = 4,
): T[] {
  if (count <= 0 || items.length === 0) return [];
  if (items.length <= count) return [...items];

  const pageCount = Math.ceil(items.length / count);
  const page = ((dayIndex % pageCount) + pageCount) % pageCount;
  const start = page * count;
  return Array.from({ length: count }, (_, offset) => items[(start + offset) % items.length]!);
}

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
