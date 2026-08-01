/**
 * "쉼표 순례길" 감정 기반 코스 매칭 엔진.
 *
 * 흐름: 감정 선택 → holy_sites에서 후보 성지 조회 → (좌표가 있으면) TourAPI로 도보권
 * 인기 관광지 실시간 페어링 → 코스 카드 조립 → 정렬/다양성 보정.
 *
 * 좌표(lat/lng)가 아직 없는 성지는 관광지 페어링 없이 "성지 단독 카드"로 내려간다 —
 * 지오코딩이 끝나면 별도 코드 수정 없이 자동으로 페어링이 살아난다.
 */

import { supabase } from '../lib/supabase';
import { getNearbyAttractions, TourApiSpot } from './tourApiService';
import { EmotionTag, HolySite } from '../types';

export interface CourseCard {
  site: HolySite;
  attraction: TourApiSpot | null;
  title: string;
  subtitle: string;
  walkMinutes: number | null;
}

interface HolySiteRow {
  id: string;
  name: string;
  category: string | null;
  diocese: string | null;
  region_province: string | null;
  location: string | null;
  description: string | null;
  history: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  seo_title: string | null;
  seo_description: string | null;
  emotion_tag: string | null;
  nearby_attractions: string | null;
  nearby_lodging: string | null;
}

function rowToSite(row: HolySiteRow): HolySite {
  return {
    id: row.id,
    name: row.name,
    category: (row.category as HolySite['category']) ?? '순례길',
    location: row.location ?? '',
    description: row.description,
    imageUrl: row.image_url,
    history: row.history,
    coordinates: { lat: row.lat, lng: row.lng },
    region: row.diocese ?? row.region_province ?? '',
    emotionTag: (row.emotion_tag as EmotionTag) ?? null,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    nearbyAttractions: row.nearby_attractions,
    nearbyLodging: row.nearby_lodging,
  };
}

/** 감정(+선택적 지역)에 맞는 후보 성지를 조회한다. 설명이 있는 곳을 우선한다. */
export async function fetchCandidateSites(
  emotion: EmotionTag,
  diocese?: string,
  limit = 10,
): Promise<HolySite[]> {
  let query = supabase.from('holy_sites').select('*').eq('emotion_tag', emotion);
  if (diocese) {
    query = query.eq('diocese', diocese);
  }
  const { data, error } = await query.limit(limit * 3); // 여유있게 가져와서 필터링/정렬
  if (error) {
    console.error('fetchCandidateSites error:', error);
    return [];
  }

  const rows = (data ?? []) as HolySiteRow[];

  // 지역 조건으로 결과가 너무 적으면 지역 조건을 풀고 감정만으로 재조회
  if (diocese && rows.length < 3) {
    return fetchCandidateSites(emotion, undefined, limit);
  }

  const sites = rows.map(rowToSite);

  // 콘텐츠 완성도 점수로 정렬하되, 동점 구간은 매 호출마다 살짝 섞어서
  // 항상 같은 상위 몇 곳만 반복 노출되지 않도록 한다.
  return jitterShuffle(sites, contentQualityScore).slice(0, limit);
}

/** 콘텐츠 완성도 점수: 소개글 분량 + 부가 필드 존재 여부를 종합한다. 정렬 1순위 기준. */
function contentQualityScore(site: HolySite): number {
  let score = 0;
  if (site.description) score += site.description.length > 100 ? 2 : 1;
  if (site.history) score += 1;
  if (site.seoTitle) score += 0.5;
  if (site.seoDescription) score += 0.5;
  if (site.nearbyAttractions) score += 0.5;
  if (site.nearbyLodging) score += 0.5;
  return score;
}

/** 안정적이되 매 호출마다 살짝 다른 결과가 나오도록 하는 얕은 셔플 (동점 구간만 섞음). */
function jitterShuffle<T>(items: T[], scoreFn: (item: T) => number): T[] {
  const withScore = items.map((item) => ({ item, score: scoreFn(item) }));
  const groups = new Map<number, T[]>();
  for (const { item, score } of withScore) {
    if (!groups.has(score)) groups.set(score, []);
    groups.get(score)!.push(item);
  }
  const sortedScores = [...groups.keys()].sort((a, b) => b - a);
  const result: T[] = [];
  for (const score of sortedScores) {
    const group = groups.get(score)!;
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
    result.push(...group);
  }
  return result;
}

const EARTH_RADIUS_KM = 6371;
const WALK_SPEED_KM_PER_MIN = 4 / 60; // 시속 4km 도보

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 좌표가 있는 성지에 한해 TourAPI로 도보권 인기 관광지를 실시간으로 페어링한다. */
async function pairWithAttraction(site: HolySite): Promise<TourApiSpot | null> {
  const { lat, lng } = site.coordinates;
  if (lat == null || lng == null) return null;

  try {
    const spots = await getNearbyAttractions(lng, lat, 3000, 5);
    // 대표 이미지가 있는 곳을 우선 (콘텐츠가 풍부한 = 상대적으로 알려진 관광지일 가능성)
    const withImage = spots.find((s) => !!s.firstimage);
    return withImage ?? spots[0] ?? null;
  } catch (e) {
    console.error(`TourAPI pairing failed for ${site.name}:`, e);
    return null;
  }
}

const EMOTION_TITLE_HINT: Record<EmotionTag, string> = {
  위로: '위로가 필요한 날',
  새출발: '새출발을 다짐하는 이에게',
  평온: '그저 쉬고 싶은 날',
  치유: '마음을 어루만지는',
  감사: '감사한 마음을 담아',
};

function buildCard(site: HolySite, attraction: TourApiSpot | null): CourseCard {
  const emotionHint = site.emotionTag ? EMOTION_TITLE_HINT[site.emotionTag] : '';
  const title = `${emotionHint}, ${site.region} ${site.name} 걷기 코스`;

  let walkMinutes: number | null = null;
  let subtitle = site.seoDescription ?? site.description?.slice(0, 60) ?? '';

  if (attraction && site.coordinates.lat != null && site.coordinates.lng != null) {
    const distKm = haversineKm(
      site.coordinates.lat,
      site.coordinates.lng,
      Number(attraction.mapy),
      Number(attraction.mapx),
    );
    walkMinutes = Math.max(1, Math.round(distKm / WALK_SPEED_KM_PER_MIN));
    subtitle = `${attraction.title} 인파를 뒤로하고, 도보 ${walkMinutes}분 ${site.name}로`;
  }

  return { site, attraction, title, subtitle, walkMinutes };
}

/** 다양성 보정: 같은 교구·같은 유형(성당/순교성지 등)이 연속으로 나오지 않도록 순서를 섞는다. */
function diversify(cards: CourseCard[]): CourseCard[] {
  const buckets = new Map<string, CourseCard[]>();
  for (const card of cards) {
    const key = `${card.site.region || '기타'}::${card.site.category}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(card);
  }
  const result: CourseCard[] = [];
  let remaining = cards.length;
  while (remaining > 0) {
    for (const bucket of buckets.values()) {
      const next = bucket.shift();
      if (next) {
        result.push(next);
        remaining -= 1;
      }
    }
  }
  return result;
}

/** 최상위 진입점: 감정(+선택적 지역)으로 추천 코스 카드 목록을 만든다. */
export async function getRecommendedCourses(
  emotion: EmotionTag,
  diocese?: string,
  limit = 5,
): Promise<CourseCard[]> {
  const sites = await fetchCandidateSites(emotion, diocese, limit * 2);

  const cards = await Promise.all(
    sites.map(async (site) => {
      const attraction = await pairWithAttraction(site);
      return buildCard(site, attraction);
    }),
  );

  // 관광지 페어링 성공 여부 + 콘텐츠 완성도로 정렬 (거리는 짧을수록 우선)
  cards.sort((a, b) => {
    const aHasPair = a.attraction ? 1 : 0;
    const bHasPair = b.attraction ? 1 : 0;
    if (aHasPair !== bHasPair) return bHasPair - aHasPair;
    return (a.walkMinutes ?? 999) - (b.walkMinutes ?? 999);
  });

  return diversify(cards).slice(0, limit);
}
