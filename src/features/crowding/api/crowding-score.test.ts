import { describe, expect, it } from 'vitest';
import type { CongestionRate } from '@/shared/api/tour-api';
import {
  combineNearbyCrowding,
  LEVEL_BOUNDS,
  pickCongestion,
  ratesForToday,
  toCrowdingLevel,
} from './crowding-score';

// 테스트는 "오늘"을 고정한다 — 실제 날짜에 따라 행이 걸러지면 안 된다.
const TODAY = '20260916';

function rate(
  tAtsNm: string,
  cnctrRate: number,
  baseYmd = TODAY,
  signguNm = '당진시',
): CongestionRate {
  return {
    baseYmd,
    areaCd: '44',
    areaNm: '충청남도',
    signguCd: '44270',
    signguNm,
    tAtsNm,
    cnctrRate: String(cnctrRate),
  };
}

describe('toCrowdingLevel — 세 단계뿐', () => {
  it('경계값은 위 등급에 속한다', () => {
    expect(toCrowdingLevel(0)).toBe('조용');
    expect(toCrowdingLevel(LEVEL_BOUNDS.quietBelow - 0.1)).toBe('조용');
    expect(toCrowdingLevel(LEVEL_BOUNDS.quietBelow)).toBe('보통');
    expect(toCrowdingLevel(LEVEL_BOUNDS.moderateBelow - 0.1)).toBe('보통');
    expect(toCrowdingLevel(LEVEL_BOUNDS.moderateBelow)).toBe('붐빔');
    expect(toCrowdingLevel(100)).toBe('붐빔');
  });
});

describe('ratesForToday — 오늘 행 고르기', () => {
  it('어제 행이 섞여 와도 오늘 행을 고른다 (2026-09-21 배포본 실측: 응답이 어제부터 옴)', () => {
    const rows = ratesForToday(
      [rate('a', 96, '20260915'), rate('a', 50, '20260916'), rate('a', 43, '20260917')],
      TODAY,
    );
    expect(rows.map((r) => r.cnctrRate)).toEqual(['50']);
  });
  it('오늘 행이 없으면 그 다음 날 — 30일 뒤 값을 오늘처럼 쓰지 않도록 가장 이른 날', () => {
    const rows = ratesForToday([rate('a', 80, '20261010'), rate('a', 20, '20260918')], TODAY);
    expect(rows[0]?.baseYmd).toBe('20260918');
  });
  it('전부 과거면 빈 배열', () => {
    expect(ratesForToday([rate('a', 96, '20260915')], TODAY)).toEqual([]);
  });
});

describe('pickCongestion — 집중률에서 성지 신호 고르기', () => {
  it('행이 없으면 null — 등급을 내지 않는다', () => {
    expect(pickCongestion('솔뫼성지', [], TODAY)).toBeNull();
  });
  it('오늘 행만 쓴다 — 어제·30일 뒤 예측을 오늘 값으로 쓰지 않는다', () => {
    const picked = pickCongestion(
      '솔뫼성지',
      [rate('솔뫼성지', 96, '20260915'), rate('솔뫼성지', 80, '20261010'), rate('솔뫼성지', 20)],
      TODAY,
    );
    expect(picked?.baseYmd).toBe(TODAY);
    expect(picked?.rate).toBe(20);
  });
  it('성지 이름이 관광지로 올라 있으면 그 값 (kind=site)', () => {
    const picked = pickCongestion('솔뫼성지', [rate('삽교호', 90), rate('솔뫼 성지', 35)], TODAY);
    expect(picked).toMatchObject({
      kind: 'site',
      name: '솔뫼 성지',
      rate: 35,
      level: '보통',
      district: '당진시',
    });
  });
  it('이름이 없으면 같은 시·군·구 관광지 중앙값 (kind=district) — 최댓값이 아니다', () => {
    const picked = pickCongestion(
      '신리성지',
      [rate('삽교호', 90), rate('왜목마을', 10), rate('아미미술관', 30)],
      TODAY,
    );
    expect(picked).toMatchObject({
      kind: 'district',
      name: null,
      rate: 30,
      level: '보통',
      count: 3,
    });
  });
  it('짝수 개면 가운데 두 값의 평균', () => {
    expect(pickCongestion('x', [rate('a', 10), rate('b', 50)], TODAY)?.rate).toBe(30);
  });
  it('값이 0~100 을 벗어나면 잘라낸다', () => {
    expect(pickCongestion('x', [rate('a', 250)], TODAY)?.rate).toBe(100);
  });
});

describe('combineNearbyCrowding — 합산과 근거', () => {
  it('집중률이 없으면 등급도 점수도 없다', () => {
    const r = combineNearbyCrowding(null);
    expect(r.level).toBeNull();
    expect(r.score).toBeNull();
    expect(r.reasons.map((x) => x.key)).toEqual(['crowdingReasonNoData']);
  });

  it('성지 자체 값(kind=site)이면 집중률을 그대로 점수·등급으로', () => {
    const congestion = pickCongestion('a', [rate('a', 50)], TODAY)!;
    const r = combineNearbyCrowding(congestion);
    expect(r.score).toBe(50);
    expect(r.level).toBe(toCrowdingLevel(r.score!));
  });

  it('시·군·구 중앙값(kind=district)이면 등급·점수를 내지 않는다 — 다른 장소 값이라 성지 얘기가 아니다', () => {
    const r = combineNearbyCrowding(pickCongestion('신리성지', [rate('삽교호', 10)], TODAY)!);
    expect(r.level).toBeNull();
    expect(r.score).toBeNull();
    // 근거 문장은 남는다 — 화면은 색 점 없이 이 문장만 그린다
    expect(r.congestion?.kind).toBe('district');
    expect(r.congestion?.level).toBe('조용');
  });

  it('성지 이름이 매칭되면 「이 성지」 근거, 아니면 시·군·구 근거 — 숫자는 어디에도 없다', () => {
    const site = combineNearbyCrowding(pickCongestion('솔뫼성지', [rate('솔뫼성지', 20)], TODAY)!);
    expect(site.reasons[0]).toEqual({ key: 'crowdingReasonSite', level: '조용' });

    const district = combineNearbyCrowding(
      pickCongestion('신리성지', [rate('삽교호', 70)], TODAY)!,
    );
    expect(district.reasons[0]).toEqual({
      key: 'crowdingReasonDistrict',
      params: { district: '당진시' },
      level: '붐빔',
    });
    for (const reason of [...site.reasons, ...district.reasons]) {
      expect(JSON.stringify(reason.params ?? {})).not.toMatch(/\d/);
    }
  });
});
