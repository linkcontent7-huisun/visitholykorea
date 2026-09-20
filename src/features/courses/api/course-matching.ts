/**
 * 「오늘의 성지 일정」 후보 엔진.
 *
 * 흐름: 마음(감정 태그) → holy_sites 후보 전체 조회 → 좌표 있는 곳 → 출발지 반경 안 →
 * 가까운 순 → 카드 3장씩. **여기서는 TourAPI 를 부르지 않는다** — 점심·오후·붐빔은
 * 카드 화면이 보이는 3장에 대해서만 실시간으로 받는다(호출 수를 줄이기 위해).
 *
 * 순위는 거리다. 예전엔 설명 길이로 줄 세우고 동점을 무작위로 섞어 같은 답에 매번 다른
 * 성지가 나왔다(2026-09-15 실측). 마음 질문은 후보 집합만 고르고, 순서는 거리가 정한다.
 *
 * 스펙: docs/10-product/재기획/2026-09-15-오늘의-성지-일정-스펙.md 6절.
 */

import {
  fetchSiteNameTranslations,
  fetchSitesByEmotion,
} from '@/features/sites/api/holy-sites.repository';
import { FALLBACK_CHAIN, type Language } from '@/shared/i18n/dictionary';
import { haversineKm } from '@/shared/lib/geo';
import type { EmotionTag, HolySite } from '@/shared/types/domain';

export const TIME_BUDGETS = ['반나절', '하루', '1박2일'] as const;
export type TimeBudget = (typeof TIME_BUDGETS)[number];

/**
 * 시간 답 → 출발지 반경(km). 대중교통 기준 — 문 앞에서 문 앞까지 시속 20km 안팎,
 * 왕복 이동이 머무는 시간을 넘지 않게. 사장님 결정 2026-09-15. 써 보고 조정한다.
 * 반경 안에 없으면 몰래 넓히지 않고 「없어요」 화면이 시간을 늘리라고 묻는다.
 */
export const RADIUS_KM_BY_TIME: Record<TimeBudget, number> = {
  반나절: 20,
  하루: 60,
  '1박2일': 180,
};

/** 카드 한 페이지 장수. 반경 안 후보는 전부 들고 있다가 3장씩 보여준다 — 중간에 끊고 「여기까지」라고 하지 않는다. */
export const CARD_PAGE_SIZE = 3;

export interface Origin {
  lat: number;
  lng: number;
  /** 화면·저장용 이름 — 「현재 위치」 또는 시·도 이름 */
  label: string;
  kind: 'gps' | 'region';
}

export interface PooledSite {
  site: HolySite;
  distanceKm: number;
  /** 소개글·역사·사진 충실도. 「소개가 자세해요」 태그 근거 */
  quality: number;
}

/**
 * 페어링에서 제외할 관광지.
 *
 * 오후 관광지 후보에 가톨릭 시설 자체가 자주 잡힌다 — 예전에 "나주 순교성지 인파를 뒤로하고
 * 나주 순교자 기념성당으로" 같은 카드가 실제로 나갔다. **가톨릭 시설만 거른다.**
 * 사찰·향교 같은 다른 종교 시설은 실제 관광지이므로 정상이다.
 */
export const CATHOLIC_TITLE = /성지|성당|순교|수도원|성모|천주교|가톨릭|공소/;

/** 콘텐츠 완성도 점수: 소개글 분량 + 부가 필드 존재 여부. 「소개가 자세해요」 태그의 근거. */
export function contentQualityScore(site: HolySite): number {
  let score = 0;
  if (site.description) score += site.description.length > 100 ? 2 : 1;
  if (site.history) score += 1;
  if (site.imageUrl) score += 1;
  if (site.seoTitle) score += 0.5;
  if (site.seoDescription) score += 0.5;
  if (site.nearbyAttractions) score += 0.5;
  if (site.nearbyLodging) score += 0.5;
  return score;
}

/**
 * 순수 함수 — 좌표 있는 성지만, 반경 안만, 가까운 순. `max` 는 테스트·특수 용도.
 * 동점은 이름순으로 고정해 같은 답에 같은 결과가 나오게 한다.
 */
export function rankByDistance(
  sites: HolySite[],
  origin: { lat: number; lng: number },
  radiusKm: number,
  max = Infinity,
): PooledSite[] {
  return sites
    .flatMap((site) => {
      const { lat, lng } = site.coordinates;
      if (lat == null || lng == null) return [];
      const distanceKm = haversineKm(origin.lat, origin.lng, lat, lng);
      return distanceKm <= radiusKm
        ? [{ site, distanceKm, quality: contentQualityScore(site) }]
        : [];
    })
    .sort((a, b) => a.distanceKm - b.distanceKm || a.site.name.localeCompare(b.site.name, 'ko'))
    .slice(0, max);
}

/**
 * 「반경을 넓히면 N곳 더 있어요」 — 다음 시간 단계 반경 안에는 있지만 지금 반경엔 없는 수.
 * 마지막 단계(1박2일)면 0. 순수 함수, 호출 0.
 */
export function countInNextRadius(
  sites: HolySite[],
  origin: { lat: number; lng: number },
  timeBudget: TimeBudget,
): number {
  const idx = TIME_BUDGETS.indexOf(timeBudget);
  const next = TIME_BUDGETS[idx + 1];
  if (!next) return 0;
  const now = rankByDistance(sites, origin, RADIUS_KM_BY_TIME[timeBudget], Infinity).length;
  const wider = rankByDistance(sites, origin, RADIUS_KM_BY_TIME[next], Infinity).length;
  return wider - now;
}

/** 마음에 맞는 성지 전체(최대 62곳). 이름은 요청 언어로 번역해 둔다 — 카드가 한 곳씩 조회하지 않게. */
export async function fetchEmotionSites(
  emotion: EmotionTag,
  language: Language,
): Promise<HolySite[]> {
  const sites = await fetchSitesByEmotion(emotion);
  const wanted =
    language === 'ko' ? [] : [language, ...FALLBACK_CHAIN[language]].filter((l) => l !== 'ko');
  if (wanted.length === 0) return sites;
  const nameById = await fetchSiteNameTranslations(
    sites.map((s) => s.id),
    wanted,
  );
  return sites.map((s) => (nameById[s.id] ? { ...s, name: nameById[s.id]! } : s));
}

/** 최상위 진입점: 마음 · 출발지 · 시간 → 반경 안 후보 전부(거리순). TourAPI 호출 0. */
export async function buildCandidatePool(
  emotion: EmotionTag,
  origin: Origin,
  timeBudget: TimeBudget,
  language: Language = 'ko',
): Promise<{ pool: PooledSite[]; moreInNextRadius: number }> {
  const sites = await fetchEmotionSites(emotion, language);
  return {
    pool: rankByDistance(sites, origin, RADIUS_KM_BY_TIME[timeBudget]),
    moreInNextRadius: countInNextRadius(sites, origin, timeBudget),
  };
}
