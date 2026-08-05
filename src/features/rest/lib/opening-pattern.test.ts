import { describe, expect, it } from 'vitest';
import { estimateOpenness, weekdayGuidance, type VerifiedOpening } from './opening-pattern';

/** 2026년 8월 기준 요일 고정용 헬퍼 (2026-08-03이 월요일) */
const MON = new Date(2026, 7, 3, 14);
const TUE = new Date(2026, 7, 4, 14);
const WED = new Date(2026, 7, 5, 14);
const SAT_AFTERNOON = new Date(2026, 7, 8, 14);
const SAT_EVENING = new Date(2026, 7, 8, 18);
const SUN = new Date(2026, 7, 9, 14);
const WED_NIGHT = new Date(2026, 7, 5, 23);
const WED_DAWN = new Date(2026, 7, 5, 4);

describe('본당 — 월·화 휴무 패턴', () => {
  it('월요일은 닫힘으로 추정한다', () => {
    const result = estimateOpenness('본당', MON);
    expect(result.status).toBe('닫힘');
    expect(result.confidence).toBe('추정');
    expect(result.reason).toContain('월·화');
  });

  it('화요일도 닫힘이다', () => {
    expect(estimateOpenness('본당', TUE).status).toBe('닫힘');
  });

  it('수요일 낮은 열림이다', () => {
    const result = estimateOpenness('본당', WED);
    expect(result.status).toBe('열림');
    expect(result.confidence).toBe('추정');
  });

  it('밤에는 열린 요일이어도 닫힘으로 본다', () => {
    expect(estimateOpenness('본당', WED_NIGHT).status).toBe('닫힘');
    expect(estimateOpenness('본당', WED_DAWN).status).toBe('닫힘');
  });
});

describe('열림과 조용함은 다른 축이다', () => {
  it('주일은 열려 있지만 붐빈다고 알려 준다', () => {
    const result = estimateOpenness('본당', SUN);
    expect(result.status).toBe('열림');
    expect(result.crowdNote).toContain('미사');
  });

  it('토요일 저녁은 특전 미사로 붐빈다고 알려 준다', () => {
    expect(estimateOpenness('본당', SAT_EVENING).crowdNote).toContain('특전');
  });

  it('토요일 낮은 별다른 귀띔이 없다', () => {
    expect(estimateOpenness('본당', SAT_AFTERNOON).crowdNote).toBeUndefined();
  });
});

describe('패턴을 모르는 유형은 추정하지 않는다', () => {
  it('공소는 확인필요로 남긴다', () => {
    const result = estimateOpenness('공소', WED);
    expect(result.status).toBe('확인필요');
    expect(result.reason).toContain('전화');
  });

  it('피정의집도 확인필요다 (예약제)', () => {
    expect(estimateOpenness('피정의집', WED).status).toBe('확인필요');
  });

  it('수도회도 확인필요다', () => {
    expect(estimateOpenness('수도회', WED).status).toBe('확인필요');
  });
});

describe('성지 — 월요일만 휴무로 추정', () => {
  it('월요일은 닫힘', () => {
    expect(estimateOpenness('성지', MON).status).toBe('닫힘');
  });

  it('화요일은 열림 (본당과 다르다)', () => {
    expect(estimateOpenness('성지', TUE).status).toBe('열림');
  });
});

describe('확인된 정보는 언제나 패턴을 이긴다', () => {
  const verified: VerifiedOpening = {
    checkedAt: '2026-08-05',
    closedWeekdays: [], // 연중무휴로 확인된 곳
    opensHour: 5,
    closesHour: 22,
    note: '24시간 개방하는 성당이에요',
  };

  it('패턴상 닫히는 월요일이어도 확인됐으면 열림이다', () => {
    const result = estimateOpenness('본당', MON, verified);
    expect(result.status).toBe('열림');
    expect(result.confidence).toBe('확인됨');
    expect(result.reason).toContain('24시간');
  });

  it('확인된 시간 밖이면 닫힘이고, 확인된 시간을 알려 준다', () => {
    const result = estimateOpenness('본당', new Date(2026, 7, 5, 23), verified);
    expect(result.status).toBe('닫힘');
    expect(result.confidence).toBe('확인됨');
    expect(result.reason).toContain('22시');
  });

  it('확인된 휴무일은 그 사실과 확인 날짜를 함께 보여 준다', () => {
    const closedOnWed: VerifiedOpening = { checkedAt: '2026-07-01', closedWeekdays: [3] };
    const result = estimateOpenness('본당', WED, closedOnWed);
    expect(result.status).toBe('닫힘');
    expect(result.reason).toContain('2026-07-01');
  });
});

describe('weekdayGuidance — 오늘 같은 날의 안내', () => {
  it('월·화에는 대안을 알려 준다', () => {
    expect(weekdayGuidance(MON)).toContain('성지');
    expect(weekdayGuidance(TUE)).toContain('성지');
  });

  it('수·목·금이 가장 좋은 날이라고 알려 준다', () => {
    expect(weekdayGuidance(WED)).toContain('가장 적은');
  });

  it('주일에는 붐빔을 미리 알려 준다', () => {
    expect(weekdayGuidance(SUN)).toContain('미사');
  });

  it('토요일은 특별한 안내가 없다', () => {
    expect(weekdayGuidance(SAT_AFTERNOON)).toBeNull();
  });
});
