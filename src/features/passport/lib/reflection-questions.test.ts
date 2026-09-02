import { describe, expect, it } from 'vitest';
import { resolveReflectionQuestion } from './reflection-questions';

describe('resolveReflectionQuestion', () => {
  it('역사가 확인된 성지는 그곳의 사실에서 나온 질문을 받는다', () => {
    expect(resolveReflectionQuestion('솔뫼성지', '순교성지').ko).toContain('김대건');
    expect(resolveReflectionQuestion('절두산 순교성지', '순교성지').ko).toContain('강');
    expect(resolveReflectionQuestion('약현성당', '역사사적지').ko).toContain('최초');
  });

  it('해미읍성과 해미국제성지는 같은 무명 순교자 질문을 공유한다', () => {
    const a = resolveReflectionQuestion('해미읍성', '역사사적지');
    const b = resolveReflectionQuestion('해미국제성지', '순교성지');
    expect(a).toEqual(b);
    expect(a.ko).toContain('이름');
  });

  it('이름 매핑이 없으면 분류 공통 질문 — 사연을 지어내지 않는다', () => {
    expect(resolveReflectionQuestion('전주 숲정이', '순교성지').ko).toContain('지키고');
    expect(resolveReflectionQuestion('어느 길', '순례길').ko).toContain('길');
  });

  it('분류조차 없어도 항상 질문 하나는 나온다 (한·영 모두)', () => {
    const q = resolveReflectionQuestion('이름 모를 성지', null);
    expect(q.ko.length).toBeGreaterThan(0);
    expect(q.en.length).toBeGreaterThan(0);
  });

  it('모든 이름 매핑 질문은 한·영이 모두 채워져 있다', () => {
    for (const name of ['절두산', '솔뫼', '해미', '배론', '갈매못', '명동', '약현', '전동']) {
      const q = resolveReflectionQuestion(name, null);
      expect(q.ko.endsWith('?')).toBe(true);
      expect(q.en.endsWith('?')).toBe(true);
    }
  });
});
