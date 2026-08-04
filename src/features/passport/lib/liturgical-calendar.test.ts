import { describe, expect, it } from 'vitest';
import { getLiturgicalEvent } from './liturgical-calendar';

// 2026년 부활 주일은 4월 5일이다. 재의 수요일은 그로부터 46일 전인 2월 18일.
const EASTER_2026 = new Date(2026, 3, 5);

describe('getLiturgicalEvent — 전례 시기', () => {
  it('재의 수요일 이후 부활 전은 사순 시기다', () => {
    const event = getLiturgicalEvent(new Date(2026, 1, 25));
    expect(event.season).toBe('사순');
    expect(event.label).toBe('사순 시기');
  });

  it('부활 주일은 부활 시기다', () => {
    expect(getLiturgicalEvent(EASTER_2026).season).toBe('부활');
  });

  it('12월 25일은 성탄 시기다', () => {
    expect(getLiturgicalEvent(new Date(2026, 11, 25)).season).toBe('성탄');
  });

  it('연초(1월 초)는 전년도 성탄 시기의 연장이다', () => {
    expect(getLiturgicalEvent(new Date(2026, 0, 3)).season).toBe('성탄');
  });
});

describe('getLiturgicalEvent — 특별 성월', () => {
  it('5월은 성모성월로 표시한다', () => {
    const event = getLiturgicalEvent(new Date(2026, 4, 15));
    expect(event.specialMonth).toBe('성모성월');
    expect(event.label).toBe('성모성월');
  });

  it('9월은 순교자성월로 표시한다 (한국 교회 고유 전통)', () => {
    expect(getLiturgicalEvent(new Date(2026, 8, 10)).specialMonth).toBe('순교자성월');
  });

  it('특별 성월이 전례 시기보다 앞선다 — 성월이면 시기 대신 성월을 보여준다', () => {
    // 5월 15일은 부활 시기(부활 후 49일 이내)이면서 동시에 성모성월이다.
    const event = getLiturgicalEvent(new Date(2026, 4, 15));
    expect(event.season).toBe('부활');
    expect(event.label).toBe('성모성월');
  });

  it('특별 성월이 아닌 달은 시기 이름을 그대로 쓴다', () => {
    expect(getLiturgicalEvent(new Date(2026, 6, 20)).specialMonth).toBeNull();
  });
});
