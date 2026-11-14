/**
 * holy_sites 테이블 접근 계층.
 *
 * DB 행(snake_case) → 도메인 타입(camelCase) 변환은 오직 이 파일의 `toHolySite` 만 담당한다.
 * 화면 컴포넌트가 직접 supabase 를 호출하지 않도록 하는 것이 이 계층의 존재 이유다.
 */

import { supabase } from '@/shared/api/supabase';
import type { HolySiteRow } from '@/shared/types/database';
import type { EmotionTag, HolySite } from '@/shared/types/domain';
import { ilikeContains } from '@/shared/api/postgrest-filter';

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

/**
 * 이름·주소 부분 일치 검색.
 *
 * `holy_sites.name`/`location` 은 한국어 원문이라 "Myeongdong Cathedral" 같은
 * 영문(또는 다른 언어) 입력은 매칭되지 않는다 — 해외 순례자 피드백(2026-09-07)으로
 * 확인됨. 번역 테이블(`holy_site_translations`)의 이름·로마자 주소도 함께 훑어
 * 매칭된 site_id 를 원문 성지에 합친다. 번역 조회가 실패해도 한국어 검색 결과는
 * 그대로 돌려준다 — 보조 경로가 주 경로를 막으면 안 된다.
 */
export async function searchSites(term: string, limit = 8): Promise<HolySite[]> {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const nativeQuery = supabase
    .from(TABLE)
    .select('*')
    .or([ilikeContains('name', trimmed), ilikeContains('location', trimmed)].join(','))
    .limit(limit);

  const translationQuery = supabase
    .from('holy_site_translations')
    .select('site_id')
    .or([ilikeContains('name', trimmed), ilikeContains('address_romanized', trimmed)].join(','))
    .limit(limit);

  const [nativeResult, translationResult] = await Promise.all([nativeQuery, translationQuery]);

  const nativeSites = unwrap(nativeResult.data, nativeResult.error, 'searchSites').map(toHolySite);

  if (translationResult.error) {
    console.warn('searchSites 번역 검색 건너뜀:', translationResult.error.message);
    return nativeSites;
  }

  const alreadyFound = new Set(nativeSites.map((s) => s.id));
  const translatedIds = [
    ...new Set(
      (translationResult.data ?? [])
        .map((row) => row.site_id as string)
        .filter((id) => !alreadyFound.has(id)),
    ),
  ];

  if (translatedIds.length === 0) return nativeSites;

  const { data: extraRows, error: extraError } = await supabase
    .from(TABLE)
    .select('*')
    .in('id', translatedIds)
    .limit(limit);

  if (extraError) {
    console.warn('searchSites 번역 매칭 성지 조회 실패:', extraError.message);
    return nativeSites;
  }

  return [...nativeSites, ...(extraRows ?? []).map(toHolySite)].slice(0, limit);
}

/**
 * 감정 태그에 해당하는 성지 전체(최대 62곳, 2026-09-15 실측). 「오늘의 성지 일정」 후보 엔진의 입력.
 * 예전엔 limit 만 걸고 ORDER BY 가 없어 같은 답에 매번 다른 6곳이 왔다 — 전부 받아 이름순으로 고정한다.
 */
export async function fetchSitesByEmotion(emotion: EmotionTag): Promise<HolySite[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('emotion_tag', emotion)
    .order('name');
  return unwrap(data, error, 'fetchSitesByEmotion').map(toHolySite);
}

/** 가벼운 성지 색인 한 줄 — 목록 전체(긴 소개글 포함) 없이 수·위치만 필요할 때 쓴다. */
export interface SiteIndexEntry {
  id: string;
  name: string;
  diocese: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * 성지 색인 — 교구별 성지 수(탐색·여권 진행률)와 "여기서 가장 가까운 성지"가 함께 쓴다.
 * 예전엔 쓰는 곳마다 열만 다른 조회 3개(교구·이름좌표·좌표)로 같은 테이블을 따로 읽었다(#106).
 * 200여 행이라 전부 받아 클라이언트에서 계산하는 편이 질의보다 단순하고 빠르다.
 */
export async function fetchSiteIndex(): Promise<SiteIndexEntry[]> {
  const { data, error } = await supabase.from(TABLE).select('id, name, diocese, lat, lng');
  return unwrap(data, error, 'fetchSiteIndex');
}

/** 좌표가 있는 성지만 — 거리 계산에 쓴다. */
export function withCoordinates(
  index: SiteIndexEntry[],
): (SiteIndexEntry & { lat: number; lng: number })[] {
  return index.filter(
    (s): s is SiteIndexEntry & { lat: number; lng: number } => s.lat !== null && s.lng !== null,
  );
}
