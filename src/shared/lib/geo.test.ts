import { describe, expect, it } from 'vitest';
import { haversineKm, kakaoDirectionsUrl, kakaoPlaceUrl, walkMinutes } from './geo';

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

describe('kakaoPlaceUrl', () => {
  it('길찾기가 아니라 지도 보기 링크를 만든다', () => {
    expect(kakaoPlaceUrl('여사울성지', 36.7, 126.8)).toBe(
      'https://map.kakao.com/link/map/%EC%97%AC%EC%82%AC%EC%9A%B8%EC%84%B1%EC%A7%80,36.7,126.8',
    );
  });

  it('쉼표가 들어간 이름도 좌표와 섞이지 않게 인코딩한다', () => {
    expect(kakaoPlaceUrl('성지, 순례길', 36.7, 126.8)).toBe(
      'https://map.kakao.com/link/map/%EC%84%B1%EC%A7%80%2C%20%EC%88%9C%EB%A1%80%EA%B8%B8,36.7,126.8',
    );
  });
});
