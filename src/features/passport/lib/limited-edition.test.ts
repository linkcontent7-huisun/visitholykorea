import { describe, expect, it } from 'vitest';
import { getInkDaysLeft, getLiturgicalEvent } from './liturgical-calendar';
import { isWydPeriod } from './wyd';

describe('getInkDaysLeft', () => {
  it('성월 잉크는 그 달의 마지막 날까지 남는다', () => {
    // 5월(성모성월) 20일 기준, 잉크가 바뀌는 첫날은 6/1(성심성월) — 12일 뒤
    const { daysLeft, nextLabel } = getInkDaysLeft(new Date(2026, 4, 20));
    expect(daysLeft).toBe(12);
    expect(nextLabel).toBe('성심성월');
  });

  it('남은 일수는 항상 1 이상이고, 라벨은 1년 안에 반드시 바뀐다', () => {
    // 사계절을 훑으며 무한 잉크가 없는지 확인
    for (const month of [0, 3, 6, 9]) {
      const { daysLeft } = getInkDaysLeft(new Date(2026, month, 15));
      expect(daysLeft).toBeGreaterThanOrEqual(1);
      expect(daysLeft).toBeLessThan(366);
    }
  });

  it('마지막 날의 다음 날에는 실제로 잉크가 바뀌어 있다', () => {
    const base = new Date(2026, 8, 10); // 순교자성월
    const { daysLeft } = getInkDaysLeft(base);
    const boundary = new Date(base);
    boundary.setDate(boundary.getDate() + daysLeft);
    expect(getLiturgicalEvent(boundary).label).not.toBe(getLiturgicalEvent(base).label);
  });
});

describe('isWydPeriod', () => {
  it('교구대회 시작(2027-07-29)부터 본대회 폐막일(2027-08-08)까지가 한정 기간이다', () => {
    expect(isWydPeriod(new Date(2027, 6, 28))).toBe(false);
    expect(isWydPeriod(new Date(2027, 6, 29))).toBe(true);
    expect(isWydPeriod(new Date(2027, 7, 8, 23, 0))).toBe(true);
    expect(isWydPeriod(new Date(2027, 7, 9))).toBe(false);
  });

  it('대회 연도가 아니면 언제나 거짓', () => {
    expect(isWydPeriod(new Date(2026, 7, 3))).toBe(false);
    expect(isWydPeriod(new Date(2028, 7, 3))).toBe(false);
  });
});
