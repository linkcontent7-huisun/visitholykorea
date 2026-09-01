import { describe, expect, it } from 'vitest';
import { countByDiocese } from './diocese-count';

describe('countByDiocese', () => {
  it('교구별로 성지 수를 센다', () => {
    const result = countByDiocese([
      { id: '1', diocese: '서울' },
      { id: '2', diocese: '서울' },
      { id: '3', diocese: '부산' },
    ]);
    expect(result['서울']).toBe(2);
    expect(result['부산']).toBe(1);
  });

  it('교구가 없는 성지는 세지 않는다 — 어느 칸에 넣을지 알 수 없다', () => {
    const result = countByDiocese([
      { id: '1', diocese: null },
      { id: '2', diocese: '서울' },
    ]);
    expect(result['서울']).toBe(1);
    expect(Object.keys(result)).toHaveLength(1);
  });

  it('빈 목록이면 빈 객체 — 아직 안 불러온 상태에서 0을 보여주면 거짓말이 된다', () => {
    expect(countByDiocese([])).toEqual({});
  });
});
