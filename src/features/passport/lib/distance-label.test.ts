import { describe, expect, it } from 'vitest';
import { distanceLabel } from './distance-label';

describe('distanceLabel — 빈 여권의 첫 순례지 제안 거리', () => {
  it('같은 시 안이면 0km 대신 "안에 있어요" — 0km 는 고장으로 읽힌다', () => {
    expect(distanceLabel('서울', 0)).toBe('서울 안에 있어요');
    expect(distanceLabel('서울', 3.2)).toBe('서울 안에 있어요');
  });

  it('가까우면 반올림 대신 범위로 말한다', () => {
    expect(distanceLabel('대전', 7.4)).toBe('대전에서 10km 안쪽');
  });

  it('멀면 숫자가 실제로 쓸모 있다', () => {
    expect(distanceLabel('부산', 42.6)).toBe('부산에서 약 43km');
  });

  it('경계값 — 5km 와 10km', () => {
    expect(distanceLabel('서울', 5)).toBe('서울에서 10km 안쪽');
    expect(distanceLabel('서울', 10)).toBe('서울에서 약 10km');
  });

  it('거리가 이상하면 출발지만 말한다 — 숫자를 지어내지 않는다', () => {
    expect(distanceLabel('서울', NaN)).toBe('서울');
    expect(distanceLabel('서울', -1)).toBe('서울');
  });
});
