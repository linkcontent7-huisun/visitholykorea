import { describe, expect, it } from 'vitest';
import { resolveStampMotif } from './stamp-motifs';

describe('resolveStampMotif', () => {
  it('건축이 확인된 성지는 이름으로 매핑된다', () => {
    expect(resolveStampMotif('서울 명동대성당', '주교좌성당').id).toBe('gothic');
    expect(resolveStampMotif('약현성당', '역사사적지').id).toBe('brick');
    expect(resolveStampMotif('전주 전동성당', '순교성지').id).toBe('romanesque');
    expect(resolveStampMotif('솔뫼성지', '순교성지').id).toBe('pine');
    expect(resolveStampMotif('배론성지', '순교성지').id).toBe('kiln');
  });

  it('해미읍성은 해미 일반 매핑보다 먼저 성곽으로 잡힌다', () => {
    expect(resolveStampMotif('해미읍성', '역사사적지').id).toBe('fortress');
    // 해미국제성지(여숫골)는 이름 매핑이 없으므로 분류 폴백을 탄다
    expect(resolveStampMotif('해미국제성지', '순교성지').id).toBe('monument');
  });

  it('이름 매핑이 없으면 분류의 상징 도장으로 폴백한다', () => {
    expect(resolveStampMotif('전주 숲정이', '순교성지').id).toBe('monument');
    expect(resolveStampMotif('어느 주교좌', '주교좌성당').id).toBe('cathedral');
    expect(resolveStampMotif('어느 사적지', '역사사적지').id).toBe('historic');
    expect(resolveStampMotif('어느 길', '순례길').id).toBe('path');
  });

  it('분류조차 없으면 보편 십자가 도장 — 항상 무언가는 나온다', () => {
    expect(resolveStampMotif('이름 모를 성지', null).id).toBe('cross');
    expect(resolveStampMotif('이름 모를 성지', '새로운분류').id).toBe('cross');
  });

  it('모든 모티프는 그릴 path 를 최소 하나 가진다', () => {
    const names = ['명동', '약현', '전동', '되재', '해미읍성', '절두산', '솔뫼', '배론'];
    for (const name of names) {
      const motif = resolveStampMotif(name, null);
      expect(motif.paths.length).toBeGreaterThan(0);
      expect(motif.label.length).toBeGreaterThan(0);
    }
  });
});
