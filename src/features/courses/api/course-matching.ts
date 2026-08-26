/**
 * "쉼표 순례길" 감정 기반 코스 매칭 엔진.
 *
 * 흐름: 감정 선택 → holy_sites 후보 조회 → (좌표가 있으면) TourAPI로 도보권 관광지
 * 실시간 페어링 → 코스 카드 조립 → 정렬·다양성 보정.
 *
 * 좌표(lat/lng)가 아직 없는 성지는 페어링 없이 "성지 단독 카드"로 내려간다 —
 * 지오코딩이 끝나면 코드 수정 없이 자동으로 페어링이 살아난다.
 */

import { fetchSitesByEmotion } from '@/features/sites/api/holy-sites.repository';
import { getNearbyAttractions, type TourApiSpot } from '@/shared/api/tour-api';
import { haversineKm, walkMinutes } from '@/shared/lib/geo';
import { withDirection } from '@/shared/lib/korean';
import type { EmotionTag, HolySite } from '@/shared/types/domain';

export interface CourseCard {
  site: HolySite;
  attraction: TourApiSpot | null;
  title: string;
  subtitle: string;
  walkMinutes: number | null;
}

const EMOTION_TITLE_HINT: Record<EmotionTag, string> = {
  위로: '위로가 필요한 날',
  새출발: '새출발을 다짐하는 이에게',
  평온: '그저 쉬고 싶은 날',
  치유: '마음을 어루만지는',
  감사: '감사한 마음을 담아',
};

/** 콘텐츠 완성도 점수: 소개글 분량 + 부가 필드 존재 여부. 정렬 1순위 기준. */
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

/** 점수 순으로 정렬하되 동점 구간만 섞어, 늘 같은 몇 곳만 노출되지 않게 한다. */
function jitterShuffle<T>(items: T[], scoreFn: (item: T) => number): T[] {
  const groups = new Map<number, T[]>();
  for (const item of items) {
    const score = scoreFn(item);
    const group = groups.get(score);
    if (group) group.push(item);
    else groups.set(score, [item]);
  }

  const result: T[] = [];
  for (const score of [...groups.keys()].sort((a, b) => b - a)) {
    const group = groups.get(score)!;
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [group[i], group[j]] = [group[j]!, group[i]!];
    }
    result.push(...group);
  }
  return result;
}

/** 감정(+선택적 교구)에 맞는 후보 성지. 설명이 충실한 곳을 우선한다. */
export async function fetchCandidateSites(
  emotion: EmotionTag,
  diocese: string | undefined,
  limit = 10,
): Promise<HolySite[]> {
  // 필터링·정렬 여유분까지 넉넉히 가져온다.
  const sites = await fetchSitesByEmotion(emotion, diocese, limit * 3);

  // 교구 조건 때문에 결과가 너무 적으면 조건을 풀고 감정만으로 다시 찾는다.
  if (diocese && sites.length < 3) {
    return fetchCandidateSites(emotion, undefined, limit);
  }

  return jitterShuffle(sites, contentQualityScore).slice(0, limit);
}

/**
 * 페어링에서 제외할 관광지.
 *
 * 이 코스의 문장은 "붐비는 관광지를 뒤로하고 조용한 성지로"다. 그런데 TourAPI 주변
 * 검색에는 가톨릭 시설 자체가 자주 잡혀서, 예전에 "나주 순교성지 인파를 뒤로하고
 * 나주 순교자 기념성당으로", "남산동 가톨릭타운 인파를 뒤로하고 관덕정 순교성지로"
 * 같은 카드가 실제로 화면에 나갔다 — 성지를 피해 성지로 가라는 말이 된다.
 *
 * **가톨릭 시설만 거른다.** 사찰·향교 같은 다른 종교 시설은 실제로 붐비는 관광지이므로
 * 페어링 상대로 정상이다(예: "심향사(나주) 인파를 뒤로하고").
 */
export const CATHOLIC_TITLE = /성지|성당|순교|수도원|성모|천주교|가톨릭|공소/;

/** 좌표가 있는 성지에 한해 도보권 관광지를 실시간으로 페어링한다. */
async function pairWithAttraction(site: HolySite): Promise<TourApiSpot | null> {
  const { lat, lng } = site.coordinates;
  if (lat == null || lng == null) return null;

  try {
    const spots = await getNearbyAttractions(lng, lat, 3000, 5);
    const secular = spots.filter((s) => !CATHOLIC_TITLE.test(s.title));
    // 대표 이미지가 있는 곳을 우선한다(콘텐츠가 풍부한 = 상대적으로 알려진 관광지).
    return secular.find((s) => Boolean(s.firstimage)) ?? secular[0] ?? null;
  } catch (e) {
    console.error(`TourAPI 페어링 실패 (${site.name}):`, e);
    return null;
  }
}

function buildCard(site: HolySite, attraction: TourApiSpot | null): CourseCard {
  const emotionHint = site.emotionTag ? EMOTION_TITLE_HINT[site.emotionTag] : '';
  const title = `${emotionHint}, ${site.region} ${site.name} 걷기 코스`;

  let minutes: number | null = null;
  let subtitle = site.seoDescription ?? site.description?.slice(0, 60) ?? '';

  if (attraction && site.coordinates.lat != null && site.coordinates.lng != null) {
    const distKm = haversineKm(
      site.coordinates.lat,
      site.coordinates.lng,
      Number(attraction.mapy),
      Number(attraction.mapx),
    );
    minutes = walkMinutes(distKm);
    subtitle = `${attraction.title} 인파를 뒤로하고, 도보 ${minutes}분 ${withDirection(site.name)}`;
  }

  return { site, attraction, title, subtitle, walkMinutes: minutes };
}

/** 같은 교구·같은 유형이 연달아 나오지 않도록 순서를 섞는다. */
function diversify(cards: CourseCard[]): CourseCard[] {
  const buckets = new Map<string, CourseCard[]>();
  for (const card of cards) {
    const key = `${card.site.region || '기타'}::${card.site.category}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(card);
    else buckets.set(key, [card]);
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

/** 출발지에서 성지까지의 거리(km). 좌표가 없으면 정렬에서 뒤로 밀리도록 Infinity. */
function distanceFromOrigin(site: HolySite, origin: { lat: number; lng: number }): number {
  const { lat, lng } = site.coordinates;
  if (lat == null || lng == null) return Infinity;
  return haversineKm(origin.lat, origin.lng, lat, lng);
}

/** 최상위 진입점: 감정(+선택적 교구, +선택적 출발지 좌표)으로 추천 코스 카드를 만든다. */
export async function getRecommendedCourses(
  emotion: EmotionTag,
  diocese?: string,
  limit = 5,
  originCoords?: { lat: number; lng: number },
): Promise<CourseCard[]> {
  const sites = await fetchCandidateSites(emotion, diocese, limit * 2);

  const cards = await Promise.all(
    sites.map(async (site) => buildCard(site, await pairWithAttraction(site))),
  );

  if (originCoords) {
    // 출발지가 있으면 "관광지 페어링 여부"보다 "출발지에서 가까운 순"이 우선이다 —
    // 시간이 한정된 사용자에게는 실제로 갈 수 있는 곳을 먼저 보여주는 게 더 중요하다.
    cards.sort(
      (a, b) => distanceFromOrigin(a.site, originCoords) - distanceFromOrigin(b.site, originCoords),
    );
  } else {
    // 출발지가 없으면 페어링 성공 여부 우선, 그다음 도보 거리가 짧은 순.
    cards.sort((a, b) => {
      const aHasPair = a.attraction ? 1 : 0;
      const bHasPair = b.attraction ? 1 : 0;
      if (aHasPair !== bHasPair) return bHasPair - aHasPair;
      return (a.walkMinutes ?? 999) - (b.walkMinutes ?? 999);
    });
  }

  return diversify(cards).slice(0, limit);
}
