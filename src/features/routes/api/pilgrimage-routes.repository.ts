/**
 * pilgrimage_routes 테이블 접근 계층.
 *
 * 코스는 "박해 사건·인물의 이야기 순서"로 성지를 꿴 것이다 — 지리 순서가 아니다.
 * 성지 상세는 holy_sites 를 그대로 참조하므로, 여기서는 순서와 코스별 의미(note)만 다룬다.
 */

import { supabase } from '@/shared/api/supabase';
import type { PilgrimageRouteRow, PilgrimageRouteSiteRow, HolySiteRow } from '@/shared/types/database';
import type { PilgrimageRoute, PilgrimageRouteStop } from '@/shared/types/domain';
import { toHolySite } from '@/features/sites/api/holy-sites.repository';

function toRoute(row: PilgrimageRouteRow, stopCount?: number): PilgrimageRoute {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    stopCount: stopCount ?? null,
  };
}

/** 코스 목록. sort_order 순. */
export async function fetchRoutes(): Promise<PilgrimageRoute[]> {
  const { data, error } = await supabase
    .from('pilgrimage_routes')
    .select('*, pilgrimage_route_sites(position)')
    .order('sort_order');
  if (error) throw new Error(`코스 목록 조회 실패: ${error.message}`);
  return (data ?? []).map((row) => {
    const { pilgrimage_route_sites: stops, ...route } = row as PilgrimageRouteRow & {
      pilgrimage_route_sites: { position: number }[];
    };
    return toRoute(route, stops?.length ?? 0);
  });
}

/** 코스 하나 + 경유지(성지 포함)를 순서대로. */
export async function fetchRouteBySlug(
  slug: string,
): Promise<{ route: PilgrimageRoute; stops: PilgrimageRouteStop[] } | null> {
  const { data: routeRow, error: routeError } = await supabase
    .from('pilgrimage_routes')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (routeError) throw new Error(`코스 조회 실패: ${routeError.message}`);
  if (!routeRow) return null;

  const { data: stopRows, error: stopsError } = await supabase
    .from('pilgrimage_route_sites')
    .select('*, holy_sites(*)')
    .eq('route_id', (routeRow as PilgrimageRouteRow).id)
    .order('position');
  if (stopsError) throw new Error(`코스 경유지 조회 실패: ${stopsError.message}`);

  const stops: PilgrimageRouteStop[] = (stopRows ?? []).map((row) => {
    const r = row as PilgrimageRouteSiteRow & { holy_sites: HolySiteRow };
    return {
      position: r.position,
      note: r.note,
      site: toHolySite(r.holy_sites),
    };
  });

  return { route: toRoute(routeRow as PilgrimageRouteRow, stops.length), stops };
}
