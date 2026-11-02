import { describe, expect, it } from 'vitest';
import { isNearSite, localityOf } from './near-site';

const hanon = {
  lat: 33.2497,
  lng: 126.5414,
  location: '제주특별자치도 서귀포시 호근동 194-1 (하논 분화구 옆)',
};

describe('localityOf', () => {
  it('도는 건너뛰고 시·군을 고른다', () => {
    expect(localityOf('제주특별자치도 서귀포시 태평로 398')).toBe('서귀포시');
    expect(localityOf('충청남도 당진시 우강면 솔뫼로 132')).toBe('당진시');
  });
  it('특별시·광역시는 구를 쓴다', () => {
    expect(localityOf('서울특별시 종로구 창경궁로 254')).toBe('종로구');
  });
  it('우편번호·빈 주소는 무시한다', () => {
    expect(localityOf('63596 제주특별자치도 서귀포시 태평로 398')).toBe('서귀포시');
    expect(localityOf(null)).toBeNull();
    expect(localityOf('주소 모름')).toBeNull();
  });
});

describe('isNearSite', () => {
  it('좌표가 있으면 10km 안만', () => {
    // 서귀포성당 — 약 2km
    expect(isNearSite({ address: null, lat: 33.244, lng: 126.563 }, hanon)).toBe(true);
    // 제주시 중앙성당 — 약 30km
    expect(isNearSite({ address: '서귀포시', lat: 33.512, lng: 126.524 }, hanon)).toBe(false);
  });
  it('좌표가 없으면 같은 시·군', () => {
    expect(isNearSite({ address: '서귀포시 서홍동 어딘가', lat: null, lng: null }, hanon)).toBe(
      true,
    );
    expect(isNearSite({ address: '제주시 연동', lat: null, lng: null }, hanon)).toBe(false);
    expect(isNearSite({ address: null, lat: null, lng: null }, hanon)).toBe(false);
  });
});
