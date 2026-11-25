import { beforeEach, describe, expect, it } from 'vitest';
import {
  hasPreviousInApp,
  recallQuery,
  recallScroll,
  rememberQuery,
  rememberScroll,
} from './back-memory';

describe('뒤로 가기 기억', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('검색어와 스크롤을 기록 칸 열쇠별로 기억한다(새로고침 뒤에도 sessionStorage 에 남는다)', () => {
    rememberQuery('k1', '문경');
    rememberScroll('k1', 320);
    rememberQuery('k2', '대전');
    expect(recallQuery('k1')).toBe('문경');
    expect(recallScroll('k1')).toBe(320);
    expect(recallQuery('k2')).toBe('대전');
    expect(recallScroll('k2')).toBeUndefined();
    expect(recallQuery('없는 칸')).toBeUndefined();
  });

  it('30칸이 넘으면 오래된 것부터 버린다', () => {
    for (let i = 0; i < 40; i++) rememberQuery(`k${i}`, `q${i}`);
    expect(recallQuery('k0')).toBeUndefined();
    expect(recallQuery('k39')).toBe('q39');
  });

  it('저장소가 깨져 있어도 던지지 않는다', () => {
    window.sessionStorage.setItem('vhk.backMemory', '{깨짐');
    expect(recallQuery('k')).toBeUndefined();
    expect(() => rememberQuery('k', 'x')).not.toThrow();
  });

  it('이 사이트 안에 앞선 화면이 있는지는 라우터가 적은 순번(idx)으로 안다', () => {
    window.history.replaceState({ idx: 0, key: 'a' }, '');
    expect(hasPreviousInApp()).toBe(false); // 주소로 바로 열었다
    window.history.replaceState({ idx: 2, key: 'b' }, '');
    expect(hasPreviousInApp()).toBe(true);
    window.history.replaceState(null, '');
    expect(hasPreviousInApp()).toBe(false);
  });
});
