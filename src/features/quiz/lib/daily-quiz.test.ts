import { afterEach, describe, expect, it } from 'vitest';
import { HOLY_QUIZZES } from '../data/holy-quiz';
import { claimTodaysPopup, dayKey, quizIndexOfDay } from './daily-quiz';

describe('holy quiz data', () => {
  it('문항 40개, 보기 4개, 정답 위치가 범위 안, id 중복 없음', () => {
    expect(HOLY_QUIZZES).toHaveLength(40);
    expect(new Set(HOLY_QUIZZES.map((q) => q.id)).size).toBe(40);
    for (const q of HOLY_QUIZZES) {
      expect(q.choices).toHaveLength(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(4);
      expect(q.explanation.ko.length).toBeGreaterThan(0);
      expect(q.explanation.en.length).toBeGreaterThan(0);
    }
  });
});

describe('quizIndexOfDay', () => {
  it('같은 날은 같은 문제, 다음 날은 다음 문제, 40일이면 한 바퀴', () => {
    const d = new Date(2026, 9, 29);
    const i = quizIndexOfDay(d);
    expect(quizIndexOfDay(new Date(2026, 9, 29, 23, 59))).toBe(i);
    expect(quizIndexOfDay(new Date(2026, 9, 30))).toBe((i + 1) % 40);
    expect(quizIndexOfDay(new Date(2026, 11, 8))).toBe(i); // 10/29 + 40일
  });

  it('40일 동안 40문항이 모두 한 번씩 나온다', () => {
    const seen = new Set<number>();
    for (let k = 0; k < 40; k++) seen.add(quizIndexOfDay(new Date(2026, 9, 29 + k)));
    expect(seen.size).toBe(40);
  });
});

describe('claimTodaysPopup', () => {
  afterEach(() => localStorage.clear());

  it('하루에 한 번만 true', () => {
    const d = new Date(2026, 9, 29, 8, 0);
    expect(claimTodaysPopup(d)).toBe(true);
    expect(claimTodaysPopup(new Date(2026, 9, 29, 22, 0))).toBe(false);
    expect(claimTodaysPopup(new Date(2026, 9, 30, 8, 0))).toBe(true);
  });

  it('dayKey 는 이용자 시계 기준 날짜', () => {
    expect(dayKey(new Date(2026, 0, 5, 0, 30))).toBe('2026-01-05');
  });
});
