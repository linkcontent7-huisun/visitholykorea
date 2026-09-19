import { describe, expect, it } from 'vitest';
import { CATHOLIC_TITLE } from './course-matching';

/**
 * 코스 카드 문장은 "붐비는 관광지를 뒤로하고 조용한 성지로"다.
 * 가톨릭 시설이 "인파" 쪽에 서면 성지를 피해 성지로 가라는 말이 된다.
 */
describe('CATHOLIC_TITLE — 페어링에서 거를 관광지', () => {
  it('가톨릭 시설을 걸러낸다', () => {
    // 실제로 화면에 잘못 나갔던 값들
    for (const title of [
      '나주 순교자 기념성당',
      '남산동 가톨릭타운',
      '절두산 순교성지',
      '명동대성당',
      '성모당',
      '베네딕도 수도원',
      '천주교 서울대교구청',
      '요당리 공소',
    ]) {
      expect(CATHOLIC_TITLE.test(title), title).toBe(true);
    }
  });

  it('가톨릭이 아닌 관광지는 통과시킨다 — 사찰·향교도 정상적인 붐비는 관광지다', () => {
    for (const title of [
      '심향사(나주)',
      '통영 세병관',
      '정몽주 동상',
      '경복궁',
      '해운대해수욕장',
      '전주향교',
      '불국사',
    ]) {
      expect(CATHOLIC_TITLE.test(title), title).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 후보 pool — 반경 · 거리순 · 좌표 없는 곳 제외. TourAPI 는 부르지 않는다(순수 함수).
// ---------------------------------------------------------------------------

import { countInNextRadius, RADIUS_KM_BY_TIME, rankByDistance } from './course-matching';
import type { HolySite } from '@/shared/types/domain';

const SEOUL = { lat: 37.5665, lng: 126.978 };

function site(name: string, lat: number | null, lng: number | null, description = ''): HolySite {
  return {
    id: name,
    name,
    category: '성지',
    diocese: null,
    regionProvince: null,
    location: null,
    description,
    history: null,
    imageUrl: null,
    imageSource: null,
    imageLicense: null,
    coordinates: { lat, lng },
    seoTitle: null,
    seoDescription: null,
    emotionTag: '위로',
    nearbyAttractions: null,
    nearbyLodging: null,
    phone: null,
    homepageUrl: null,
    fax: null,
  } as unknown as HolySite;
}

// 서울시청 기준 대략 거리: 절두산 ≈ 7km · 미리내(안성) ≈ 62km · 솔뫼(당진) ≈ 90km · 대구 ≈ 237km
const SITES = [
  site('솔뫼', 36.885, 126.63),
  site('절두산', 37.5436, 126.9105, 'a'.repeat(200)),
  site('미리내', 37.0, 127.28),
  site('계산성당(대구)', 35.868, 128.588),
  site('좌표없음', null, null),
];

describe('rankByDistance — 반경 안 · 가까운 순', () => {
  it('반나절 20km 면 절두산만 남는다', () => {
    const r = rankByDistance(SITES, SEOUL, RADIUS_KM_BY_TIME.반나절);
    expect(r.map((p) => p.site.name)).toEqual(['절두산']);
  });

  it('하루 60km · 1박2일 180km 로 넓어지고, 좌표 없는 곳은 어떤 반경에도 안 들어온다', () => {
    expect(rankByDistance(SITES, SEOUL, RADIUS_KM_BY_TIME.하루).map((p) => p.site.name)).toEqual([
      '절두산',
    ]);
    expect(
      rankByDistance(SITES, SEOUL, RADIUS_KM_BY_TIME['1박2일']).map((p) => p.site.name),
    ).toEqual(['절두산', '미리내', '솔뫼']);
    expect(rankByDistance(SITES, SEOUL, Infinity).map((p) => p.site.name)).not.toContain(
      '좌표없음',
    );
  });

  it('거리가 오름차순이고 최대 개수를 넘지 않는다', () => {
    const r = rankByDistance(SITES, SEOUL, Infinity, 2);
    expect(r).toHaveLength(2);
    expect(r[0]!.distanceKm).toBeLessThan(r[1]!.distanceKm);
  });

  it('반경 안에 아무것도 없으면 빈 배열 — 반경을 몰래 넓히지 않는다', () => {
    expect(rankByDistance(SITES, { lat: 33.5, lng: 126.5 }, 20)).toEqual([]);
  });
});

describe('countInNextRadius — 「반경을 넓히면 N곳 더 있어요」', () => {
  it('반나절 → 하루로 넓히면 늘어나는 수만 센다', () => {
    // 20km 엔 절두산 1곳, 60km 에도 1곳 → 0. 60 → 180 이면 미리내·솔뫼 2곳.
    expect(countInNextRadius(SITES, SEOUL, '반나절')).toBe(0);
    expect(countInNextRadius(SITES, SEOUL, '하루')).toBe(2);
  });

  it('마지막 단계(1박2일)에서는 0', () => {
    expect(countInNextRadius(SITES, SEOUL, '1박2일')).toBe(0);
  });
});
