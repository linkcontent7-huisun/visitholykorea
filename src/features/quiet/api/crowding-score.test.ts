import { describe, expect, it } from 'vitest';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { CONTENT_TYPE } from '@/shared/api/tour-api';
import type { Coordinates } from '@/shared/types/domain';
import {
  combineCrowdingScore,
  festivalPressure,
  infraDensity,
  MAX_SCORE,
  saturate,
  toCrowdingLevel,
} from './crowding-score';

/** 해미순교성지 근처 좌표 */
const HAEMI: Coordinates = { lat: 36.7137, lng: 126.5433 };

function spot(overrides: Partial<TourApiSpot> = {}): TourApiSpot {
  return {
    contentid: '1',
    contenttypeid: String(CONTENT_TYPE.관광지),
    title: '테스트 장소',
    addr1: '충남 서산시',
    addr2: '',
    mapx: String(HAEMI.lng),
    mapy: String(HAEMI.lat),
    firstimage: '',
    ...overrides,
  };
}

/** 기준점에서 대략 km 만큼 북쪽으로 떨어진 좌표 (위도 1도 ≈ 111km) */
function northOf(km: number): { mapx: string; mapy: string } {
  return { mapx: String(HAEMI.lng), mapy: String(HAEMI.lat! + km / 111) };
}

describe('saturate — 포화 곡선', () => {
  it('값이 0이면 0점이다', () => {
    expect(saturate(0, 50, 1)).toBe(0);
  });

  it('상한을 절대 넘지 않는다', () => {
    expect(saturate(10_000, 50, 1)).toBeLessThanOrEqual(50);
  });

  it('값이 포화 상수와 같으면 상한의 약 63%가 된다', () => {
    expect(saturate(8, 30, 8)).toBeCloseTo(30 * 0.632, 1);
  });

  it('늘어날수록 증가폭이 줄어든다', () => {
    const first = saturate(1, 30, 8) - saturate(0, 30, 8);
    const later = saturate(21, 30, 8) - saturate(20, 30, 8);
    expect(later).toBeLessThan(first);
  });
});

describe('festivalPressure — 축제 압력', () => {
  it('오늘 열리는 행사가 없으면 0점이다', () => {
    const result = festivalPressure(HAEMI, []);
    expect(result.score).toBe(0);
    expect(result.count).toBe(0);
    expect(result.nearest).toBeNull();
  });

  it('반경 15km 밖 행사는 점수에 반영되지 않는다', () => {
    const result = festivalPressure(HAEMI, [spot({ ...northOf(40), title: '먼 축제' })]);
    expect(result.score).toBe(0);
    expect(result.count).toBe(0);
  });

  it('반경 밖이어도 가장 가까운 행사는 안내용으로 남긴다', () => {
    const result = festivalPressure(HAEMI, [spot({ ...northOf(40), title: '먼 축제' })]);
    expect(result.nearest?.title).toBe('먼 축제');
    expect(result.nearest?.distanceKm).toBeGreaterThan(15);
  });

  it('가까운 행사일수록 점수가 높다', () => {
    const near = festivalPressure(HAEMI, [spot(northOf(1))]);
    const far = festivalPressure(HAEMI, [spot(northOf(12))]);
    expect(near.score).toBeGreaterThan(far.score);
  });

  it('행사가 많을수록 점수가 높지만 상한을 넘지 않는다', () => {
    const many = Array.from({ length: 20 }, () => spot(northOf(1)));
    const result = festivalPressure(HAEMI, many);
    expect(result.count).toBe(20);
    expect(result.score).toBeLessThanOrEqual(MAX_SCORE.festival);
  });

  it('좌표가 없는 성지는 계산하지 않는다', () => {
    expect(festivalPressure({ lat: null, lng: null }, [spot()]).score).toBe(0);
  });

  it('좌표가 0인 행사는 건너뛴다 (TourAPI에 종종 섞여 있다)', () => {
    const result = festivalPressure(HAEMI, [spot({ mapx: '0', mapy: '0' })]);
    expect(result.count).toBe(0);
    expect(result.nearest).toBeNull();
  });
});

describe('infraDensity — 주변 인프라 밀도', () => {
  it('유형별로 나누어 센다', () => {
    const result = infraDensity([
      spot({ contenttypeid: String(CONTENT_TYPE.관광지) }),
      spot({ contenttypeid: String(CONTENT_TYPE.문화시설) }),
      spot({ contenttypeid: String(CONTENT_TYPE.음식점) }),
      spot({ contenttypeid: String(CONTENT_TYPE.숙박) }),
      spot({ contenttypeid: String(CONTENT_TYPE.음식점) }),
    ]);
    expect(result.attractionCount).toBe(2);
    expect(result.stayCount).toBe(3);
  });

  it('아무것도 없으면 0점이다', () => {
    const result = infraDensity([]);
    expect(result.attractionScore).toBe(0);
    expect(result.stayScore).toBe(0);
  });

  it('축제·행사 유형은 인프라로 세지 않는다 (축제 압력에서 따로 다룬다)', () => {
    const result = infraDensity([spot({ contenttypeid: String(CONTENT_TYPE.축제공연행사) })]);
    expect(result.attractionCount).toBe(0);
    expect(result.stayCount).toBe(0);
  });
});

describe('toCrowdingLevel — 등급', () => {
  it('점수 구간에 맞는 등급을 준다', () => {
    expect(toCrowdingLevel(0)).toBe('아주 조용');
    expect(toCrowdingLevel(14.9)).toBe('아주 조용');
    expect(toCrowdingLevel(15)).toBe('조용');
    expect(toCrowdingLevel(29.9)).toBe('조용');
    expect(toCrowdingLevel(30)).toBe('보통');
    expect(toCrowdingLevel(50)).toBe('붐빔');
    expect(toCrowdingLevel(70)).toBe('매우 붐빔');
    expect(toCrowdingLevel(100)).toBe('매우 붐빔');
  });
});

describe('combineCrowdingScore — 합산', () => {
  it('아무것도 없는 곳은 0점, 아주 조용이다', () => {
    const result = combineCrowdingScore(festivalPressure(HAEMI, []), infraDensity([]));
    expect(result.score).toBe(0);
    expect(result.level).toBe('아주 조용');
    expect(result.isPartial).toBe(false);
  });

  it('세 축의 합은 100을 넘지 않는다', () => {
    const festivals = Array.from({ length: 30 }, () => spot(northOf(0.5)));
    const infra = [
      ...Array.from({ length: 50 }, () => spot({ contenttypeid: String(CONTENT_TYPE.관광지) })),
      ...Array.from({ length: 50 }, () => spot({ contenttypeid: String(CONTENT_TYPE.음식점) })),
    ];
    const result = combineCrowdingScore(festivalPressure(HAEMI, festivals), infraDensity(infra));
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.level).toBe('매우 붐빔');
  });

  it('인프라 조회 전이면 임시 점수로 표시한다', () => {
    const result = combineCrowdingScore(festivalPressure(HAEMI, []), null);
    expect(result.isPartial).toBe(true);
    expect(result.breakdown.attraction).toBe(0);
  });

  it('행사가 없으면 그 사실을 근거 문장으로 남긴다', () => {
    const result = combineCrowdingScore(festivalPressure(HAEMI, []), infraDensity([]));
    expect(result.reasons[0]).toContain('오늘 열리는 행사가 없습니다');
  });

  it('행사가 있으면 개수와 가장 가까운 거리를 알려준다', () => {
    const result = combineCrowdingScore(
      festivalPressure(HAEMI, [spot({ ...northOf(2), title: '해미읍성 축제' })]),
      infraDensity([]),
    );
    expect(result.reasons[0]).toContain('행사 1곳');
    expect(result.reasons[1]).toContain('해미읍성 축제');
  });
});
