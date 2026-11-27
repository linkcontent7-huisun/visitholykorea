import { describe, expect, it } from 'vitest';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { rankAfternoon } from './afternoon-pick';

const spot = (title: string, dist: number): TourApiSpot =>
  ({
    contentid: title,
    contenttypeid: '12',
    title,
    addr1: '',
    addr2: '',
    mapx: '0',
    mapy: '0',
    firstimage: '',
    dist: String(dist),
  }) as TourApiSpot;

// 붐빔(집중률)으로 고르던 것은 뺐다 — 이제 가까운 순만(사장님 2026-11-27, 공모전 종료)
describe('rankAfternoon — 오후 관광지 순서', () => {
  it('가톨릭 시설은 뺀다', () => {
    const r = rankAfternoon([spot('절두산 순교성지', 100), spot('망원한강공원', 900)]);
    expect(r.map((p) => p.spot.title)).toEqual(['망원한강공원']);
  });

  it('가까운 순', () => {
    const r = rankAfternoon([spot('경복궁', 300), spot('동네공원', 50), spot('북촌한옥마을', 100)]);
    expect(r.map((p) => p.spot.title)).toEqual(['동네공원', '북촌한옥마을', '경복궁']);
  });

  it('거리 값이 없으면 맨 뒤', () => {
    const r = rankAfternoon([{ ...spot('거리없음', 0), dist: undefined }, spot('가까움', 10)]);
    expect(r.map((p) => p.spot.title)).toEqual(['가까움', '거리없음']);
  });
});
