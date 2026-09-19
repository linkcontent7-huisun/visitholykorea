import { describe, expect, it } from 'vitest';
import type { CongestionRate, TourApiSpot } from '@/shared/api/tour-api';
import { matchCongestion, rankAfternoon, toCongestionLevel } from './afternoon-pick';

const spot = (title: string, dist: number): TourApiSpot =>
  ({ contentid: title, contenttypeid: '12', title, addr1: '', addr2: '', mapx: '0', mapy: '0', firstimage: '', dist: String(dist) }) as TourApiSpot;
const rate = (tAtsNm: string, cnctrRate: number, baseYmd = '20260915'): CongestionRate =>
  ({ baseYmd, areaNm: '', signguNm: '', tAtsNm, cnctrRate: String(cnctrRate) }) as CongestionRate;

describe('rankAfternoon — 오후 관광지 순서', () => {
  it('가톨릭 시설은 뺀다', () => {
    const r = rankAfternoon([spot('절두산 순교성지', 100), spot('망원한강공원', 900)]);
    expect(r.map((p) => p.spot.title)).toEqual(['망원한강공원']);
  });

  it('집중률이 없으면 가까운 순', () => {
    const r = rankAfternoon([spot('B', 900), spot('A', 100)]);
    expect(r.map((p) => p.spot.title)).toEqual(['A', 'B']);
    expect(r[0]!.congestion).toBeNull();
  });

  it('집중률이 있는 곳은 낮은 순으로 앞에, 없는 곳은 뒤에 가까운 순', () => {
    const r = rankAfternoon(
      [spot('경복궁', 100), spot('북촌한옥마을', 300), spot('동네공원', 50)],
      [rate('경복궁', 85), rate('북촌한옥마을', 35)],
    );
    expect(r.map((p) => `${p.spot.title}:${p.congestion}:${p.level}`)).toEqual([
      '북촌한옥마을:35:easy',
      '경복궁:85:busy',
      '동네공원:null:null',
    ]);
  });
});

describe('matchCongestion — 이름 매칭', () => {
  it('공백·괄호를 무시하고 포함 관계면 같은 곳', () => {
    const rates = [rate('경복궁', 70), rate('국립 중앙박물관', 20)];
    expect(matchCongestion('경복궁(서울)', rates)).toBe(70);
    expect(matchCongestion('국립중앙박물관', rates)).toBe(20);
    expect(matchCongestion('남산타워', rates)).toBeNull();
  });

  it('가장 이른 날짜(오늘) 행만 쓴다 — 응답은 오늘부터 30일치가 섞여 온다', () => {
    const rates = [rate('경복궁', 90, '20260915'), rate('경복궁', 30, '20261010')];
    expect(matchCongestion('경복궁', rates)).toBe(90);
  });
});

describe('toCongestionLevel', () => {
  it('40 미만 여유 · 40~69 보통 · 70 이상 붐빌 예정', () => {
    expect(toCongestionLevel(39)).toBe('easy');
    expect(toCongestionLevel(40)).toBe('moderate');
    expect(toCongestionLevel(70)).toBe('busy');
  });
});
