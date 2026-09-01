/**
 * holy_sites 테이블 접근 계층.
 *
 * DB 행(snake_case) → 도메인 타입(camelCase) 변환은 오직 이 파일의 `toHolySite` 만 담당한다.
 * 화면 컴포넌트가 직접 supabase 를 호출하지 않도록 하는 것이 이 계층의 존재 이유다.
 */

import { supabase } from '@/shared/api/supabase';
import type { HolySiteRow } from '@/shared/types/database';
import type { EmotionTag, HolySite } from '@/shared/types/domain';

const TABLE = 'holy_sites';

export function toHolySite(row: HolySiteRow): HolySite {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? '순례길',
    region: row.diocese ?? row.region_province ?? '',
    location: row.location ?? '',
    description: row.description,
    history: row.history,
    imageUrl: row.image_url,
    imageSource: row.image_source ?? null,
    imageLicense: row.image_license ?? null,
    coordinates: { lat: row.lat, lng: row.lng },
    emotionTag: (row.emotion_tag as EmotionTag | null) ?? null,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    nearbyAttractions: row.nearby_attractions,
    nearbyLodging: row.nearby_lodging,
    phone: row.phone ?? null,
    homepageUrl: row.homepage_url ?? null,
    fax: row.fax ?? null,
  };
}

function unwrap<T>(data: T | null, error: { message: string } | null, context: string): T {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
  if (data === null) {
    throw new Error(`${context}: 데이터가 없습니다.`);
  }
  return data;
}

/** 성지 목록. 대표 이미지가 있는 곳만 보고 싶을 때 withImageOnly 를 쓴다. */
export async function fetchSites(
  options: { limit?: number; withImageOnly?: boolean } = {},
): Promise<HolySite[]> {
  const { limit = 20, withImageOnly = false } = options;
  let query = supabase.from(TABLE).select('*').limit(limit);
  if (withImageOnly) {
    query = query.not('image_url', 'is', null);
  }
  const { data, error } = await query;
  return unwrap(data, error, 'fetchSites').map(toHolySite);
}

/** 성지 1곳 상세. */
export async function fetchSiteById(id: string): Promise<HolySite> {
  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
  return toHolySite(unwrap(data, error, 'fetchSiteById'));
}

/** 교구(+선택적 분류)로 거른 성지 목록. */
export async function fetchSitesByDiocese(diocese: string, category?: string): Promise<HolySite[]> {
  let query = supabase.from(TABLE).select('*').eq('diocese', diocese);
  if (category && category !== '전체') {
    query = query.eq('category', category);
  }
  const { data, error } = await query.order('name');
  return unwrap(data, error, 'fetchSitesByDiocese').map(toHolySite);
}

/** 같은 교구의 다른 성지 (상세 페이지 하단 추천). */
export async function fetchSitesInSameDiocese(
  diocese: string,
  excludeId: string,
  limit = 6,
): Promise<HolySite[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('diocese', diocese)
    .neq('id', excludeId)
    .limit(limit);
  return unwrap(data, error, 'fetchSitesInSameDiocese').map(toHolySite);
}

/** 이름·주소 부분 일치 검색. */
export async function searchSites(term: string, limit = 8): Promise<HolySite[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .or(`name.ilike.%${trimmed}%,location.ilike.%${trimmed}%`)
    .limit(limit);
  return unwrap(data, error, 'searchSites').map(toHolySite);
}

/** 감정 태그(+선택적 교구)에 해당하는 후보 성지. 코스 추천 엔진의 입력. */
export async function fetchSitesByEmotion(
  emotion: EmotionTag,
  diocese: string | undefined,
  limit: number,
): Promise<HolySite[]> {
  let query = supabase.from(TABLE).select('*').eq('emotion_tag', emotion);
  if (diocese) {
    query = query.eq('diocese', diocese);
  }
  const { data, error } = await query.limit(limit);
  return unwrap(data, error, 'fetchSitesByEmotion').map(toHolySite);
}

/** 교구별 전체 성지 수 집계 (순례 여권 진행률 계산용). */
export async function fetchSiteDioceseIndex(): Promise<{ id: string; diocese: string | null }[]> {
  const { data, error } = await supabase.from(TABLE).select('id, diocese');
  return unwrap(data, error, 'fetchSiteDioceseIndex');
}

/** 성지 좌표 인덱스 — 순례 별자리 카드가 방문지를 실제 위치에 찍을 때 쓴다. */
export async function fetchSiteCoordsIndex(): Promise<
  { id: string; lat: number | null; lng: number | null }[]
> {
  const { data, error } = await supabase.from(TABLE).select('id, lat, lng');
  return unwrap(data, error, 'fetchSiteCoordsIndex');
}

// ---------------------------------------------------------------------------
// 성지 콘텐츠 번역 (holy_site_translations)
// ---------------------------------------------------------------------------

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

/** 한 성지의 특정 언어 번역. 없으면 null — 호출부는 원문으로 폴백한다. */
export async function fetchSiteTranslation(
  siteId: string,
  language: string,
): Promise<SiteTranslation | null> {
  const { data, error } = await supabase
    .from('holy_site_translations')
    .select('name, description, history, address_romanized')
    .eq('site_id', siteId)
    .eq('language', language)
    .maybeSingle();

  if (error) {
    console.error('fetchSiteTranslation error:', error);
    return null;
  }
  if (!data) return null;
  return {
    name: data.name as string | null,
    description: data.description as string | null,
    history: data.history as string | null,
    addressRomanized: data.address_romanized as string | null,
  };
}
