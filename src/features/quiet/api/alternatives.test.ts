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
    source: 'estimated',
  };
}

function scored(name: string, km: number, score: number): ScoredSite {
  return { site: site(name, northOf(km)), crowding: crowding(score) };
}

// ---------------------------------------------------------------------------

describe('estimateTravel — 이동 부담 표시', () => {
  it('2km 이하는 도보권으로 표시하되 도보 시간은 계산하지 않는다', () => {
    const t = estimateTravel(1.5);
    expect(t.mode).toBe('도보권');
    expect(t.label).toContain('직선거리');
    expect(t.label).not.toContain('분');
  });

  it('2km를 넘으면 대중교통·차로 표시한다', () => {
    expect(estimateTravel(5).mode).toBe('대중교통·차');
  });

  it('1km 미만은 m, 이상은 km 로 적고 참고값임을 밝힌다', () => {
    expect(estimateTravel(3.4).label).toBe('직선거리 3.4km · 참고값');
    expect(estimateTravel(0.4).label).toBe('직선거리 400m · 참고값');
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

  it('개선폭이 커도 등급이 그대로면 정식 추천에서 뺀다', () => {
    // 실제로 화면에 나갔던 값 — 경복궁 95.4 → 행주 성당 76.5.
    // 19점이나 내려가지만 70점 위는 전부 「매우 붐빔」이라 등급이 그대로다.
    // 붐빔을 피하러 온 사람에게 권할 곳이 아니다.
    const { picks, relaxed } = rankAlternatives(HWASEONG, 95.4, [
      scored('여전히 매우 붐빔', 3, 76.5),
      scored('보통까지 내려감', 16, 33),
    ]);

    expect(picks[0]?.site.name).toBe('보통까지 내려감');
    expect(picks.map((p) => p.site.name)).not.toContain('여전히 매우 붐빔');
    expect(relaxed).toBe(false);
  });

  it('등급이 내려가는 곳이 하나도 없으면 기준을 풀어 보여준다', () => {
    // 개선폭은 minRelief 를 넘지만 둘 다 「매우 붐빔」에 머문다.
    const { picks, relaxed } = rankAlternatives(HWASEONG, 95, [
      scored('가깝고 조금 나음', 2, 78),
      scored('멀고 더 나음', 10, 72),
    ]);

    expect(relaxed).toBe(true);
    // 기준을 푼 경로에서는 조용한 순이다
    expect(picks[0]?.site.name).toBe('멀고 더 나음');
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
  it('점수 차가 아니라 등급과 직선거리로 말한다', () => {
    const { picks } = rankAlternatives(HWASEONG, 80, [scored('수원 화성 순교성지', 1.5, 20)]);
    const reason = buildAlternativeReason('화성행궁', '매우 붐빔', picks[0]!);

    expect(reason).toContain('화성행궁(매우 붐빔) 대신');
    expect(reason).toContain('「조용」');
    expect(reason).toContain('직선거리 1.5km');
    expect(reason).not.toMatch(/점 한적/);
    expect(reason).not.toContain('도보');
  });
});

describe('rankAlternatives — 정직한 분기', () => {
  it('출발지가 이미 「조용」 이하면 이동을 권하지 않는다', () => {
    const result = rankAlternatives(HWASEONG, 20, [scored('A', 1, 5)]);
    expect(result.outcome).toBe('origin_quiet');
    expect(result.picks).toEqual([]);
  });

  it('출발지 주변 정보를 못 받았으면 비교하지 않는다', () => {
    const result = rankAlternatives(HWASEONG, 80, [scored('A', 1, 5)], { originUnverified: true });
    expect(result.outcome).toBe('origin_unverified');
    expect(result.picks).toEqual([]);
  });

  it('주변 정보를 못 받은 후보는 순위에서 빼고 확인 부족으로 따로 낸다', () => {
    const partial = scored('실패한 성지', 0.5, 3);
    partial.crowding.isPartial = true;
    const result = rankAlternatives(HWASEONG, 80, [partial, scored('확인된 성지', 3, 20)]);
    expect(result.picks.map((p) => p.site.name)).toEqual(['확인된 성지']);
    expect(result.unverified.map((p) => p.site.name)).toEqual(['실패한 성지']);
    expect(result.outcome).toBe('recommended');
  });

  it('확인된 대안이 없으면 none — 추천하지 않는다', () => {
    const result = rankAlternatives(HWASEONG, 80, [scored('더 붐빔', 1, 90)]);
    expect(result.outcome).toBe('none');
    expect(result.picks).toEqual([]);
  });
});
