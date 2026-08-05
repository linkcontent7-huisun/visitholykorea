import { describe, expect, it } from 'vitest';
import {
  availableSpots,
  evidenceLabel,
  placementOf,
  spotAvailability,
  type RestSpot,
} from './rest-spot';

// 2026-08-03이 월요일 (본당 휴무), 08-05가 수요일
const MON = new Date(2026, 7, 3, 14);
const WED = new Date(2026, 7, 5, 14);
const MON_NIGHT = new Date(2026, 7, 3, 22);

function spot(overrides: Partial<RestSpot> = {}): RestSpot {
  return {
    id: 'spot-1',
    placeId: 'place-1',
    placeName: '테스트 성당',
    placeKind: '본당',
    kind: '성당 내부',
    evidence: { level: '추정' },
    ...overrides,
  };
}

describe('placementOf — 실내와 야외를 가른다', () => {
  it('성당 내부와 성체조배실은 실내다', () => {
    expect(placementOf('성당 내부')).toBe('실내');
    expect(placementOf('성체조배실')).toBe('실내');
  });

  it('성모상 앞·정원·십자가의 길은 야외다', () => {
    expect(placementOf('성모상 앞')).toBe('야외');
    expect(placementOf('정원·마당')).toBe('야외');
    expect(placementOf('십자가의 길')).toBe('야외');
  });
});

describe('본당이 쉬는 월요일 — 이게 이 모델의 핵심이다', () => {
  it('성당 내부는 닫힌다', () => {
    expect(spotAvailability(spot({ kind: '성당 내부' }), MON).status).toBe('닫힘');
  });

  it('성모상 앞은 열려 있다', () => {
    const result = spotAvailability(spot({ kind: '성모상 앞' }), MON);
    expect(result.status).toBe('열림');
    expect(result.reason).toContain('건물이 닫혀도');
  });

  it('정원도 열려 있다', () => {
    expect(spotAvailability(spot({ kind: '정원·마당' }), MON).status).toBe('열림');
  });

  it('휴무일에도 갈 수 있는 자리를 남겨 준다', () => {
    const spots = [
      spot({ id: '내부', kind: '성당 내부' }),
      spot({ id: '성모상', kind: '성모상 앞' }),
      spot({ id: '정원', kind: '정원·마당' }),
    ];
    const open = availableSpots(spots, MON);
    expect(open).toHaveLength(2);
    expect(open.map((o) => o.spot.id)).not.toContain('내부');
  });
});

describe('수요일 — 실내도 열린다', () => {
  it('성당 내부가 열린다', () => {
    expect(spotAvailability(spot({ kind: '성당 내부' }), WED).status).toBe('열림');
  });

  it('실내를 야외보다 먼저 보여준다 (앉을 수 있고 날씨를 안 탄다)', () => {
    const spots = [
      spot({ id: '성모상', kind: '성모상 앞' }),
      spot({ id: '내부', kind: '성당 내부' }),
    ];
    expect(availableSpots(spots, WED)[0]?.spot.id).toBe('내부');
  });
});

describe('야외 자리의 밤 안내', () => {
  it('밤에는 열려 있어도 주의를 준다', () => {
    const result = spotAvailability(spot({ kind: '성모상 앞' }), MON_NIGHT);
    expect(result.status).toBe('열림');
    expect(result.cautionNote).toContain('어둡고');
  });

  it('낮에는 주의 문구가 없다', () => {
    expect(spotAvailability(spot({ kind: '성모상 앞' }), MON).cautionNote).toBeUndefined();
  });
});

describe('성체조배실 — 확인 전에는 단정하지 않는다', () => {
  it('확인 정보가 없으면 확인필요로 남긴다', () => {
    const result = spotAvailability(spot({ kind: '성체조배실' }), WED);
    expect(result.status).toBe('확인필요');
  });

  it('24시간 개방으로 확인됐으면 휴무일에도 열림이다', () => {
    const result = spotAvailability(
      spot({
        kind: '성체조배실',
        verifiedOpening: {
          checkedAt: '2026-08-05',
          closedWeekdays: [],
          opensHour: 0,
          closesHour: 24,
          note: '24시간 개방하는 조배실이에요',
        },
      }),
      MON,
    );
    expect(result.status).toBe('열림');
    expect(result.confidence).toBe('확인됨');
  });
});

describe('근거 등급 — 짐작을 사실처럼 보여주지 않는다', () => {
  it('추정은 확인이 필요하다고 말한다', () => {
    expect(evidenceLabel({ level: '추정' })).toContain('짐작');
  });

  it('방문확인은 날짜를 함께 보여준다', () => {
    expect(evidenceLabel({ level: '방문확인', checkedAt: '2026-08-10' })).toContain('2026-08-10');
  });

  it('자료확인은 출처가 성당임을 밝힌다', () => {
    expect(evidenceLabel({ level: '자료확인' })).toContain('성당');
  });

  it('야외 자리도 근거가 추정이면 확신도를 추정으로 둔다', () => {
    const guessed = spotAvailability(spot({ kind: '성모상 앞', evidence: { level: '추정' } }), MON);
    expect(guessed.confidence).toBe('추정');

    const visited = spotAvailability(
      spot({ kind: '성모상 앞', evidence: { level: '방문확인', checkedAt: '2026-08-10' } }),
      MON,
    );
    expect(visited.confidence).toBe('확인됨');
  });

  it('근거가 튼튼한 자리를 먼저 보여준다', () => {
    const spots = [
      spot({ id: '짐작', kind: '정원·마당', evidence: { level: '추정' } }),
      spot({
        id: '확인',
        kind: '정원·마당',
        evidence: { level: '방문확인', checkedAt: '2026-08-10' },
      }),
    ];
    expect(availableSpots(spots, MON)[0]?.spot.id).toBe('확인');
  });
});
