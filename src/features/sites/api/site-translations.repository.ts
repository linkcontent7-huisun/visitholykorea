/**
 * 성지 콘텐츠 번역(holy_site_translations) 조회.
 * holy-sites.repository.ts 에서 떼어 냈다(#106, 2026-11-14) — 원문 성지 조회와 번역 조회를 나눠 읽기 쉽게.
 */

import { supabase } from '@/shared/api/supabase';
import type { SiteTranslation } from '../lib/translated-site';

/**
 * 한 성지를 여러 언어로 한 번에 받아 온다.
 *
 * 스페인어 사용자에게 스페인어 번역이 없다고 한국어를 보여주면 아무것도 못 읽는다.
 * 요청 언어와 폴백 언어(영어)를 **한 번의 조회로** 같이 받아, 칸 단위로 겹친다
 * (`resolveTranslation`). 언어마다 따로 부르면 왕복이 늘어난다.
 */
export async function fetchSiteTranslations(
  siteId: string,
  languages: string[],
): Promise<Partial<Record<string, SiteTranslation>>> {
  if (languages.length === 0) return {};

  const { data, error } = await supabase
    .from('holy_site_translations')
    .select('language, name, description, history, address_romanized')
    .eq('site_id', siteId)
    .in('language', languages);

  if (error) {
    console.error('fetchSiteTranslations error:', error);
    return {};
  }

  const byLanguage: Partial<Record<string, SiteTranslation>> = {};
  for (const row of data ?? []) {
    byLanguage[row.language as string] = {
      name: row.name as string | null,
      description: row.description as string | null,
      history: row.history as string | null,
      addressRomanized: row.address_romanized as string | null,
    };
  }
  return byLanguage;
}

/**
 * 목록·카드용 — 여러 성지의 **이름만** 한 번에 번역해 온다.
 *
 * 상세 페이지의 `fetchSiteTranslations`는 성지 1곳의 전문(설명·역사 포함)을 받는
 * 용도라 목록에 그대로 쓰면 N+1 조회가 된다. 여기는 site_id 전체를 `in()` 한 번으로
 * 묶고 이름 칸만 받아, 카드가 많은 화면(홈 그리드·검색 결과·지도)에서도 조회가 하나다.
 * languages 는 우선순위 순서(요청 언어 → 폴백)로 넘기고, 그 순서대로 첫 값을 채택한다.
 */
/** 목록·카드가 쓰는 번역 두 칸. 주소는 모든 언어에서 영문 로마자 표기 한 벌을 같이 쓴다. */
export interface SiteListTranslation {
  name: string | null;
  address: string | null;
}

/**
 * 여러 성지의 이름·영문 주소를 한 번의 조회로 받는다(카드 수만큼 조회하지 않는다).
 * 언어 우선순위는 `languages` 순서 — 칸마다 따로 고른다. 스페인어 이름은 있는데
 * 주소가 비어 있으면 영어 주소를 쓴다 (주소는 208곳 전부 영어 번역이 있다, 2026-09-12).
 */
export async function fetchSiteListTranslations(
  siteIds: string[],
  languages: string[],
): Promise<Record<string, SiteListTranslation>> {
  if (siteIds.length === 0 || languages.length === 0) return {};

  const { data, error } = await supabase
    .from('holy_site_translations')
    .select('site_id, language, name, address_romanized')
    .in('site_id', siteIds)
    .in('language', languages);

  if (error) {
    console.warn('fetchSiteListTranslations skipped:', error.message);
    return {};
  }

  const languagePriority = new Map(languages.map((lang, i) => [lang, i]));
  const best = new Map<
    string,
    { name: string | null; namePriority: number; address: string | null; addressPriority: number }
  >();
  for (const row of data ?? []) {
    const siteId = row.site_id as string;
    const priority = languagePriority.get(row.language as string) ?? Number.MAX_SAFE_INTEGER;
    const name = (row.name as string | null)?.trim() || null;
    const address = (row.address_romanized as string | null)?.trim() || null;
    const current = best.get(siteId) ?? {
      name: null,
      namePriority: Number.MAX_SAFE_INTEGER,
      address: null,
      addressPriority: Number.MAX_SAFE_INTEGER,
    };
    if (name && priority < current.namePriority) {
      current.name = name;
      current.namePriority = priority;
    }
    if (address && priority < current.addressPriority) {
      current.address = address;
      current.addressPriority = priority;
    }
    best.set(siteId, current);
  }

  return Object.fromEntries(
    [...best]
      .filter(([, v]) => v.name || v.address)
      .map(([id, v]) => [id, { name: v.name, address: v.address }]),
  );
}

/** 이름만 필요한 호출부(코스 매칭)용. */
export async function fetchSiteNameTranslations(
  siteIds: string[],
  languages: string[],
): Promise<Record<string, string>> {
  const rows = await fetchSiteListTranslations(siteIds, languages);
  return Object.fromEntries(
    Object.entries(rows)
      .filter(([, v]) => v.name)
      .map(([id, v]) => [id, v.name as string]),
  );
}
