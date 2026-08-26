import { describe, expect, it } from 'vitest';
import { directionParticle, finalJongseong, withDirection } from './korean';

describe('finalJongseong', () => {
  it('받침 없는 글자는 0', () => {
    expect(finalJongseong('성지')).toBe(0);
    expect(finalJongseong('가')).toBe(0);
  });

  it("'ㄹ' 받침은 8", () => {
    expect(finalJongseong('절')).toBe(8);
    expect(finalJongseong('여사울')).toBe(8);
  });

  it('그 밖의 받침은 0도 8도 아니다', () => {
    expect(finalJongseong('성당')).not.toBe(0);
    expect(finalJongseong('성당')).not.toBe(8);
  });

  it('한글로 끝나지 않으면 null', () => {
    expect(finalJongseong('Seoul')).toBeNull();
    expect(finalJongseong('성지 1')).toBeNull();
    expect(finalJongseong('')).toBeNull();
  });

  it('끝의 공백은 무시한다', () => {
    expect(finalJongseong('성당  ')).toBe(finalJongseong('성당'));
  });
});

describe('directionParticle', () => {
  it('받침이 없으면 "로"', () => {
    // 실제 성지 이름 — 화면에 그대로 나가는 값이다.
    expect(directionParticle('절두산 순교성지')).toBe('로');
    expect(directionParticle('여사울성지')).toBe('로');
    expect(directionParticle('천진암 성지')).toBe('로');
  });

  it("'ㄹ' 받침이면 \"로\"", () => {
    expect(directionParticle('서울')).toBe('로');
    expect(directionParticle('갈')).toBe('로');
  });

  it('그 밖의 받침이면 "으로"', () => {
    // 이 세 개가 예전에 "…성당로"로 나가던 값이다.
    expect(directionParticle('나주 순교자 기념성당')).toBe('으로');
    expect(directionParticle('약현성당')).toBe('으로');
    expect(directionParticle('명동대성당')).toBe('으로');
    expect(directionParticle('진남문')).toBe('으로');
  });

  it('한글이 아니면 "로"', () => {
    expect(directionParticle('Solmoe')).toBe('로');
  });
});

describe('withDirection', () => {
  it('조사를 붙여 돌려준다', () => {
    expect(withDirection('절두산 순교성지')).toBe('절두산 순교성지로');
    expect(withDirection('나주 순교자 기념성당')).toBe('나주 순교자 기념성당으로');
  });
});
