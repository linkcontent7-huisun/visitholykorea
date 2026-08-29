import { describe, expect, it } from 'vitest';
import { DICTIONARY, isLanguage, LANGUAGES, LANGUAGE_LABEL } from './dictionary';

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
