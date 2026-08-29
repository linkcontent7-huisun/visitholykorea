import { describe, expect, it } from 'vitest';
import { DICTIONARY, fillPlaceholders, isLanguage, LANGUAGES, LANGUAGE_LABEL } from './dictionary';

describe('isLanguage', () => {
  it('지원하는 6개 언어 코드를 통과시킨다', () => {
    for (const lang of LANGUAGES) {
      expect(isLanguage(lang)).toBe(true);
    }
  });

  it('저장값이 없거나 낡은 값이면 거른다 — 예전 버전이 남긴 값에 앱이 깨지면 안 된다', () => {
    expect(isLanguage(null)).toBe(false);
    expect(isLanguage('de')).toBe(false);
    expect(isLanguage('')).toBe(false);
  });
});

describe('DICTIONARY', () => {
  it('모든 문구가 6개 언어를 빠짐없이 갖는다', () => {
    for (const [key, entry] of Object.entries(DICTIONARY)) {
      for (const lang of LANGUAGES) {
        expect((entry as Record<string, string>)[lang], `${key}.${lang}`).toBeTruthy();
      }
    }
  });

  it('언어 이름은 그 언어로 적는다 — 못 읽는 언어로 쓰면 고를 수가 없다', () => {
    expect(LANGUAGE_LABEL.es).toBe('Español');
    expect(LANGUAGE_LABEL.ko).toBe('한국어');
  });
});

describe('fillPlaceholders', () => {
  it('{n} 같은 자리표시자를 값으로 바꾼다', () => {
    expect(fillPlaceholders('{total}곳 가운데 {n}곳', { n: 3, total: 208 })).toBe(
      '208곳 가운데 3곳',
    );
  });

  it('같은 자리표시자가 여러 번 나와도 모두 바꾼다', () => {
    expect(fillPlaceholders('{n} + {n}', { n: 5 })).toBe('5 + 5');
  });

  it('값이 없는 자리표시자는 그대로 둔다 — 몰래 빈칸이 되면 더 헷갈린다', () => {
    expect(fillPlaceholders('{n}곳 / {missing}', { n: 1 })).toBe('1곳 / {missing}');
  });
});
