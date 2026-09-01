import { describe, expect, it } from 'vitest';
import { fitWithin } from './photo';

describe('fitWithin — 업로드 사진 축소 크기', () => {
  it('최장변을 1600 으로 줄이고 비율을 지킨다', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 });
  });

  it('이미 작은 사진은 건드리지 않는다 — 확대는 화질만 버린다', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 });
  });

  it('경계값 — 정확히 1600 이면 그대로', () => {
    expect(fitWithin(1600, 900, 1600)).toEqual({ width: 1600, height: 900 });
  });
});
