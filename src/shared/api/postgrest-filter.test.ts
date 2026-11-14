import { describe, expect, it } from 'vitest';
import { ilikeContains, quoteFilterValue } from './postgrest-filter';

describe('quoteFilterValue', () => {
  it('값을 큰따옴표로 감싼다', () => {
    expect(quoteFilterValue('명동')).toBe('"명동"');
  });

  it('쉼표·괄호·마침표는 따옴표 안에 그대로 둔다', () => {
    expect(quoteFilterValue('St. Paul (Seoul), 명동')).toBe('"St. Paul (Seoul), 명동"');
  });

  it('큰따옴표와 역슬래시는 이스케이프한다', () => {
    expect(quoteFilterValue('a"b\\c')).toBe('"a\\"b\\\\c"');
  });
});

describe('ilikeContains', () => {
  it('부분 일치 조건을 만든다', () => {
    expect(ilikeContains('name', '명동')).toBe('name.ilike."%명동%"');
  });

  it('조건을 끼워 넣으려는 입력도 값 하나로 묶인다', () => {
    // 따옴표 밖에 쉼표가 생기지 않으므로 or() 가 조건을 둘로 나누지 않는다
    expect(ilikeContains('name', 'x%,id.eq.foo')).toBe('name.ilike."%x%,id.eq.foo%"');
  });
});
