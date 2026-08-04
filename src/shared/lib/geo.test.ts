import { describe, expect, it } from 'vitest';
import { haversineKm, kakaoDirectionsUrl, walkMinutes } from './geo';

describe('haversineKm', () => {
  it('같은 지점이면 0을 돌려준다', () => {
    expect(haversineKm(37.5665, 126.978, 37.5665, 126.978)).toBe(0);
  });

  it('서울시청 ↔ 명동성당은 1km 안팎이다', () => {
    const km = haversineKm(37.5665, 126.978, 37.5633, 126.9873);
    expect(km).toBeGreaterThan(0.5);
    expect(km).toBeLessThan(1.5);
  });
});

describe('walkMinutes', () => {
  it('4km는 시속 4km 기준 60분이다', () => {
    expect(walkMinutes(4)).toBe(60);
  });

  it('아주 가까워도 최소 1분으로 표시한다', () => {
    expect(walkMinutes(0.001)).toBe(1);
  });
});

describe('kakaoDirectionsUrl', () => {
  it('성지 이름을 URL 인코딩해 넣는다', () => {
    expect(kakaoDirectionsUrl('절두산 순교성지', 37.5497, 126.9)).toBe(
      'https://map.kakao.com/link/to/%EC%A0%88%EB%91%90%EC%82%B0%20%EC%88%9C%EA%B5%90%EC%84%B1%EC%A7%80,37.5497,126.9',
    );
  });
});
