/**
 * pilgrimage_routes 테이블 접근 계층.
 *
 * 코스는 "박해 사건·인물의 이야기 순서"로 성지를 꿴 것이다 — 지리 순서가 아니다.
 * 성지 상세는 holy_sites 를 그대로 참조하므로, 여기서는 순서와 코스별 의미(note)만 다룬다.
 */

import { supabase } from '@/shared/api/supabase';
import type {
  PilgrimageRouteRow,
  PilgrimageRouteSiteRow,
  PilgrimageRouteTranslationRow,
  PilgrimageRouteSiteTranslationRow,
  HolySiteRow,
} from '@/shared/types/database';
import type { PilgrimageRoute, PilgrimageRouteStop } from '@/shared/types/domain';
import { toHolySite } from '@/features/sites/api/holy-sites.repository';
import type { RouteTranslation } from '../lib/translated-route';

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

/** 코스 상세 1곳의 언어별 번역 전문(제목·부제·설명). 상세 화면이 폴백 순서대로 겹쳐 쓴다. */
export async function fetchRouteTranslations(
  routeId: string,
  languages: string[],
): Promise<Partial<Record<string, RouteTranslation>>> {
  if (languages.length === 0) return {};

  const { data, error } = await supabase
    .from('pilgrimage_route_translations')
    .select('language, title, subtitle, description')
    .eq('route_id', routeId)
    .in('language', languages);

  if (error) {
    console.error('fetchRouteTranslations error:', error);
    return {};
  }

  const byLanguage: Partial<Record<string, RouteTranslation>> = {};
  for (const row of (data ?? []) as Pick<
    PilgrimageRouteTranslationRow,
    'language' | 'title' | 'subtitle' | 'description'
  >[]) {
    byLanguage[row.language] = {
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
    };
  }
  return byLanguage;
}

/**
 * 목록 카드용 — 여러 코스의 제목·부제·설명을 한 번에 번역해 온다.
 * languages 는 우선순위 순서(요청 언어 → 폴백)로 넘기고, 칸마다 그 순서로 첫 값을 채택한다.
 */
export async function fetchRouteListTranslations(
  routeIds: string[],
  languages: string[],
): Promise<Record<string, RouteTranslation>> {
  if (routeIds.length === 0 || languages.length === 0) return {};

  const { data, error } = await supabase
    .from('pilgrimage_route_translations')
    .select('route_id, language, title, subtitle, description')
    .in('route_id', routeIds)
    .in('language', languages);

  if (error) {
    console.warn('fetchRouteListTranslations skipped:', error.message);
    return {};
  }

  type Field = 'title' | 'subtitle' | 'description';
  const priority = new Map(languages.map((lang, i) => [lang, i]));
  const best = new Map<string, { value: RouteTranslation; rank: Record<Field, number> }>();

  for (const row of (data ?? []) as PilgrimageRouteTranslationRow[]) {
    const rank = priority.get(row.language) ?? Number.MAX_SAFE_INTEGER;
    const current = best.get(row.route_id) ?? {
      value: { title: null, subtitle: null, description: null },
      rank: {
        title: Number.MAX_SAFE_INTEGER,
        subtitle: Number.MAX_SAFE_INTEGER,
        description: Number.MAX_SAFE_INTEGER,
      },
    };
    (['title', 'subtitle', 'description'] as Field[]).forEach((field) => {
      const value = (row[field] ?? '').trim() || null;
      if (value && rank < current.rank[field]) {
        current.value[field] = value;
        current.rank[field] = rank;
      }
    });
    best.set(row.route_id, current);
  }

  return Object.fromEntries([...best.entries()].map(([id, v]) => [id, v.value]));
}

/**
 * 한 코스의 경유지 메모(note) 번역을 site_id 기준으로 받아 온다.
 * languages 우선순위 순서로 칸마다 첫 값을 채택한다.
 */
export async function fetchRouteStopTranslations(
  routeId: string,
  languages: string[],
): Promise<Record<string, string>> {
  if (languages.length === 0) return {};

  const { data, error } = await supabase
    .from('pilgrimage_route_site_translations')
    .select('site_id, language, note')
    .eq('route_id', routeId)
    .in('language', languages);

  if (error) {
    console.warn('fetchRouteStopTranslations skipped:', error.message);
    return {};
  }

  const priority = new Map(languages.map((lang, i) => [lang, i]));
  const best = new Map<string, { note: string; rank: number }>();

  for (const row of (data ?? []) as Pick<
    PilgrimageRouteSiteTranslationRow,
    'site_id' | 'language' | 'note'
  >[]) {
    const rank = priority.get(row.language) ?? Number.MAX_SAFE_INTEGER;
    const note = (row.note ?? '').trim();
    const current = best.get(row.site_id);
    if (note && (!current || rank < current.rank)) {
      best.set(row.site_id, { note, rank });
    }
  }

  return Object.fromEntries([...best.entries()].map(([id, v]) => [id, v.note]));
}
