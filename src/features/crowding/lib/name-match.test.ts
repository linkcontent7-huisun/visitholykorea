import { describe, expect, it } from 'vitest';
import { isSameSpot, normalizeName } from './name-match';

describe('isSameSpot — 집중률 관광지 이름 매칭', () => {
  it('공백과 괄호를 무시한다', () => {
    expect(normalizeName('솔뫼 성지 (당진)')).toBe('솔뫼성지');
    expect(isSameSpot('솔뫼성지', '솔뫼 성지')).toBe(true);
  });

  it('3자 이상이 포함되면 같은 곳으로 본다', () => {
    expect(isSameSpot('절두산순교성지', '절두산 순교성지 · 한국천주교순교자박물관')).toBe(true);
  });

  it('「대성당」과 「성당」을 같게 본다 — 집중률의 "서울 명동성당" ↔ 우리 "명동대성당"', () => {
    expect(isSameSpot('명동대성당', '서울 명동성당')).toBe(true);
  });

  it('2자 포함은 매칭하지 않는다 — "서울" 이 "서울숲" 에 붙으면 안 된다', () => {
    expect(isSameSpot('서울', '서울숲')).toBe(false);
    expect(isSameSpot('', '서울숲')).toBe(false);
  });
});
