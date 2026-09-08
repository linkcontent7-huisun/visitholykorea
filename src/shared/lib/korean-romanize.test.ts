import { describe, expect, it } from 'vitest';
import { hasHangul, romanizeKorean } from './korean-romanize';

describe('romanizeKorean — 받침 없는 기본 음절', () => {
  it.each([
    ['서울', 'Seoul'],
    ['부산', 'Busan'],
    ['제주', 'Jeju'],
  ])('%s → %s', (input, expected) => {
    expect(romanizeKorean(input)).toBe(expected);
  });
});

describe('romanizeKorean — 받침 있는 음절(연음 없음)', () => {
  it.each([
    ['대전', 'Daejeon'],
    ['광주', 'Gwangju'],
    ['인천', 'Incheon'],
    ['안동', 'Andong'],
    ['명동', 'Myeongdong'],
  ])('%s → %s', (input, expected) => {
    expect(romanizeKorean(input)).toBe(expected);
  });
});

describe('romanizeKorean — 연음(받침 다음이 모음으로 시작하는 음절)', () => {
  it('일요일 — ㄹ받침이 다음 음절 초성으로 넘어가 "r"이 된다', () => {
    expect(romanizeKorean('일요일')).toBe('Iryoil');
  });
});

describe('romanizeKorean — 한글이 아닌 문자·혼합 문자열', () => {
  it('숫자·기호는 그대로 둔다', () => {
    expect(romanizeKorean('망우동 13-4')).toBe('Mangudong 13-4');
  });

  it('빈 문자열은 빈 문자열', () => {
    expect(romanizeKorean('')).toBe('');
  });

  it('이미 영문뿐이면 그대로 돌려준다', () => {
    expect(romanizeKorean('Seoul')).toBe('Seoul');
  });
});

describe('hasHangul', () => {
  it('한글이 있으면 true', () => {
    expect(hasHangul('서울특별시')).toBe(true);
  });

  it('한글이 없으면 false', () => {
    expect(hasHangul('123 Main St.')).toBe(false);
  });
});
