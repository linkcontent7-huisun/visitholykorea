import { describe, expect, it } from 'vitest';
import { isWydVenue } from './wyd';

describe('isWydVenue', () => {
  it('공식 일정지로 확정 발표된 솔뫼·해미만 참이다', () => {
    expect(isWydVenue('솔뫼성지')).toBe(true);
    expect(isWydVenue('해미읍성')).toBe(true);
    expect(isWydVenue('해미국제성지')).toBe(true);
  });

  it('그 외 성지는 거짓 — 추측으로 배지를 달지 않는다', () => {
    expect(isWydVenue('서울 명동대성당')).toBe(false);
    expect(isWydVenue('절두산 순교성지')).toBe(false);
  });
});
