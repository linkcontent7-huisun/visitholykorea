import { describe, expect, it } from 'vitest';
import { BREAD_QUIZ, BREAD_STORY, pickQuizzes, QUIZ_PER_EPISODE, STORY_SOURCES } from './bread-story';

describe('1호 이야기·퀴즈 데이터', () => {
  it('퀴즈 id 는 겹치지 않고 DB 규칙(소문자·숫자·하이픈 40자)에 맞는다', () => {
    const ids = BREAD_QUIZ.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]{1,40}$/);
  });

  it('정답 번호가 보기 안에 있고, 모든 퀴즈가 실제 있는 화에 붙는다', () => {
    const episodes = new Set(BREAD_STORY.map((e) => e.no));
    for (const q of BREAD_QUIZ) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.choices.length);
      expect(episodes.has(q.episode)).toBe(true);
    }
  });

  it('칸마다 단 출처 번호는 출처 목록에 있다', () => {
    const known = new Set(STORY_SOURCES.map((s) => s.id));
    for (const ep of BREAD_STORY) for (const p of ep.panels) for (const n of p.src) expect(known.has(n)).toBe(true);
  });

  it('퀴즈는 30문제, 화마다 10문제', () => {
    expect(BREAD_QUIZ).toHaveLength(30);
    for (const ep of [1, 2, 3]) expect(BREAD_QUIZ.filter((q) => q.episode === ep)).toHaveLength(10);
  });

  it('신청자에 맞춰 화마다 정해진 수만큼 고르고, 아이가 있으면 아이용 문제가 먼저 나온다', () => {
    const kids = pickQuizzes({ children: 2, seniors: 0 });
    expect(kids).toHaveLength(QUIZ_PER_EPISODE * 3);
    expect(kids.every((q) => q.for.includes('kid'))).toBe(true);
    const seniors = pickQuizzes({ children: 0, seniors: 1 });
    expect(seniors.every((q) => q.for.includes('senior'))).toBe(true);
    expect(pickQuizzes(undefined)).toHaveLength(QUIZ_PER_EPISODE * 3);
  });
});
