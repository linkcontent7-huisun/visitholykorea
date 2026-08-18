import { describe, expect, it } from 'vitest';
import type { Coordinates, HolySite } from '@/shared/types/domain';
import type { CrowdingScore } from './crowding-score';
import { toCrowdingLevel } from './crowding-score';
import {
  ALTERNATIVE,
  buildAlternativeReason,
  estimateTravel,
  rankAlternatives,
  type ScoredSite,
} from './alternatives';

/** 화성행궁 좌표 — 접수 기획서의 사례 그대로 */
const HWASEONG: Coordinates = { lat: 37.2812, lng: 127.0128 };

/** 기준점에서 대략 km 만큼 북쪽으로 떨어진 좌표 (위도 1도 ≈ 111km) */
function northOf(km: number): Coordinates {
  return { lat: HWASEONG.lat! + km / 111, lng: HWASEONG.lng };
}

function site(name: string, coordinates: Coordinates): HolySite {
  return {
    id: name,
    name,
    category: '순교성지',
    region: '수원',
    location: '경기도 수원시',
    description: null,
    history: null,
    imageUrl: null,
    imageSource: null,
    imageLicense: null,
    coordinates,
    emotionTag: null,
    seoTitle: null,
    seoDescription: null,
    nearbyAttractions: null,
    nearbyLodging: null,
    phone: null,
    homepageUrl: null,
    fax: null,
  };
}

function crowding(score: number): CrowdingScore {
  return {
    score,
    level: toCrowdingLevel(score),
    breakdown: { festival: 0, attraction: score, stay: 0 },
    reasons: [],
    festivalCount: 0,
    nearestFestival: null,
    attractionCount: 0,
    stayCount: 0,
    isPartial: false,
  };
}

function scored(name: string, km: number, score: number): ScoredSite {
  return { site: site(name, northOf(km)), crowding: crowding(score) };
}

// ---------------------------------------------------------------------------

describe('estimateTravel — 이동 수단 추정', () => {
  it('2km 이하는 도보로 안내한다', () => {
    const t = estimateTravel(1.5);
    expect(t.mode).toBe('도보');
    expect(t.walkMinutes).toBeGreaterThan(0);
  });

  it('기획서 사례(도보 20분)와 어긋나지 않는다 — 1.5km는 20분 내외', () => {
    expect(estimateTravel(1.5).walkMinutes).toBe(20);
  });

  it('2km를 넘으면 대중교통·차로 바뀌고 도보 시간을 내지 않는다', () => {
    const t = estimateTravel(5);
    expect(t.mode).toBe('대중교통·차');
    // 교통 상황을 모르므로 소요 시간을 지어내지 않는다
    expect(t.walkMinutes).toBeNull();
  });

  it('아주 가까워도 최소 1분으로 표기한다 (0분은 오해를 부른다)', () => {
    expect(estimateTravel(0.01).walkMinutes).toBe(1);
  });

  it('1km 미만은 m 단위로 적는다', () => {
    expect(estimateTravel(3.4).label).toBe('3.4km');
    expect(estimateTravel(0.4).label).toContain('분'); // 도보라 분으로 표기
  });
});

describe('rankAlternatives — 대체지 순위', () => {
  const ORIGIN_SCORE = 80;

  it('충분히 조용해지는 곳 중 가장 가까운 곳을 먼저 준다', () => {
    const { picks } = rankAlternatives(HWASEONG, ORIGIN_SCORE, [
      scored('멀고 아주 조용', 15, 5),
      scored('가깝고 충분히 조용', 2, 30),
    ]);

    // 30점도 80점 대비 50점 개선이라 기준을 넘는다 → 가까운 쪽이 이긴다
    expect(picks[0]?.site.name).toBe('가깝고 충분히 조용');
  });

  it('반경 밖은 아무리 조용해도 제외한다', () => {
    const { picks } = rankAlternatives(HWASEONG, ORIGIN_SCORE, [scored('반경 밖', 50, 0)]);
    expect(picks).toHaveLength(0);
  });

  it('개선폭이 최소 기준에 못 미치면 정식 추천에서 뺀다', () => {
    // 70점 → 개선폭 10점, minRelief(15) 미만
    const { picks, relaxed } = rankAlternatives(HWASEONG, ORIGIN_SCORE, [
      scored('별로 안 조용', 3, 70),
    ]);

    expect(relaxed).toBe(true); // 기준을 풀어 보여주되
    expect(picks[0]?.site.name).toBe('별로 안 조용'); // 그래도 후보로는 남긴다
  });

  it('기준을 푼 경우에는 가까운 순이 아니라 조용한 순으로 고른다', () => {
    const { picks, relaxed } = rankAlternatives(HWASEONG, ORIGIN_SCORE, [
      scored('가깝지만 덜 조용', 1, 75),
      scored('조금 멀지만 더 조용', 5, 68),
    ]);

    expect(relaxed).toBe(true);
    expect(picks[0]?.site.name).toBe('조금 멀지만 더 조용');
  });

  it('출발지보다 붐비는 곳은 절대 추천하지 않는다', () => {
    const { picks } = rankAlternatives(HWASEONG, 40, [scored('더 붐빔', 2, 90)]);
    expect(picks).toHaveLength(0);
  });

  it('개선폭이 정확히 최소 기준이면 정식 추천에 든다 (경계 포함)', () => {
    const { relaxed, picks } = rankAlternatives(HWASEONG, ORIGIN_SCORE, [
      scored('경계값', 3, ORIGIN_SCORE - ALTERNATIVE.minRelief),
    ]);

    expect(relaxed).toBe(false);
    expect(picks).toHaveLength(1);
  });

  it('좌표가 없는 출발지에서는 빈 결과를 준다', () => {
    const { picks } = rankAlternatives({ lat: null, lng: null }, ORIGIN_SCORE, [
      scored('아무데나', 1, 10),
    ]);
    expect(picks).toHaveLength(0);
  });

  it('좌표 없는 성지는 후보에서 건너뛴다', () => {
    const noCoords: ScoredSite = {
      site: site('좌표없음', { lat: null, lng: null }),
      crowding: crowding(0),
    };
    const { picks } = rankAlternatives(HWASEONG, ORIGIN_SCORE, [noCoords, scored('정상', 2, 10)]);

    expect(picks).toHaveLength(1);
    expect(picks[0]?.site.name).toBe('정상');
  });

  it('limit 만큼만 돌려준다', () => {
    const { picks } = rankAlternatives(
      HWASEONG,
      ORIGIN_SCORE,
      [scored('A', 1, 10), scored('B', 2, 10), scored('C', 3, 10), scored('D', 4, 10)],
      { limit: 2 },
    );
    expect(picks).toHaveLength(2);
  });

  it('개선폭을 소수 첫째 자리까지만 남긴다', () => {
    const { picks } = rankAlternatives(HWASEONG, 80, [scored('A', 1, 33.33)]);
    expect(picks[0]?.relief).toBe(46.7);
  });
});

describe('buildAlternativeReason — 추천 문구', () => {
  it('도보권이면 걸리는 시간을 말한다', () => {
    const { picks } = rankAlternatives(HWASEONG, 80, [scored('수원 화성 순교성지', 1.5, 20)]);
    const reason = buildAlternativeReason('화성행궁', picks[0]!);

    expect(reason).toContain('화성행궁보다');
    expect(reason).toContain('한적합니다');
    expect(reason).toContain('도보');
  });

  it('먼 곳이면 시간 대신 거리를 말한다 (교통 소요는 추정하지 않는다)', () => {
    const { picks } = rankAlternatives(HWASEONG, 80, [scored('먼 성지', 8, 20)]);
    const reason = buildAlternativeReason('화성행궁', picks[0]!);

    expect(reason).toContain('km');
    expect(reason).not.toContain('도보');
  });
});
