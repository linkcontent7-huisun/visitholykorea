import { describe, expect, it } from 'vitest';
import {
  DICTIONARY,
  fillPlaceholders,
  isLanguage,
  LANGUAGES,
  LANGUAGE_LABEL,
  type Language,
} from './dictionary';

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

  /**
   * 아래 세 검사는 「칸이 비었는지」만 보던 위 검사의 구멍을 메운다 (T-030, 2026-09-20).
   * 그날 es·fr·pt·it 칸에 영어를 그대로 복사해 둔 키가 57개였는데 빈 칸이 아니라 전부 통과했다.
   */
  const FOREIGN = ['es', 'fr', 'pt', 'it'] as const;
  const entries = Object.entries(DICTIONARY) as [string, Record<Language, string>][];

  // 고유명사·약어는 언어가 달라도 같은 글자가 맞다. 여기 적힌 키만 예외다 — 늘리려면 이유를 적을 것.
  const SAME_IN_EVERY_LANGUAGE = new Set([
    'providerNaver',
    'providerKakao',
    'providerFacebook',
    'contactFax',
    // 글자 크기 단추 P·M·G — pequeño/petit/pequeno/piccolo, grande 의 머리글자라 네 언어가 같다
    'textSizeSmall',
    'textSizeMedium',
    'textSizeLarge',
  ]);

  it('네 외국어 칸이 서로 똑같으면 번역이 안 된 것이다 (고유명사 예외 제외)', () => {
    for (const [key, entry] of entries) {
      if (SAME_IN_EVERY_LANGUAGE.has(key)) continue;
      const distinct = new Set(FOREIGN.map((lang) => entry[lang]));
      expect(distinct.size, `${key}: es·fr·pt·it 가 모두 "${entry.es}"`).toBeGreaterThan(1);
    }
  });

  it('문장 길이의 외국어 칸이 영어와 똑같으면 복사해 둔 것이다', () => {
    // 한 낱말(Pause·Email·Contact·Normal)은 프랑스어·이탈리아어에서 실제로 영어와 같을 수 있어 12자 넘는 것만 본다.
    for (const [key, entry] of entries) {
      if (entry.en.length <= 12) continue;
      for (const lang of FOREIGN) {
        expect(entry[lang], `${key}.${lang} 가 영어 그대로`).not.toBe(entry.en);
      }
    }
  });

  it('외국어 칸에 한글이 섞여 있지 않다', () => {
    for (const [key, entry] of entries) {
      for (const lang of ['en', ...FOREIGN] as const) {
        expect(entry[lang], `${key}.${lang}`).not.toMatch(/[가-힣]/);
      }
    }
  });

  // 두 줄 제목이라 한국어는 1행에, 나머지는 2행에 지역 이름이 온다 — 나눠 쓰는 것이 의도다.
  const PLACEHOLDERS_DIFFER_BY_DESIGN = new Set(['regionHeroTitle', 'regionHeroTitleLine2']);

  it('{n} 같은 자리표시자는 여섯 언어가 같은 것을 쓴다 — 빠지면 그 언어만 값이 안 찍힌다', () => {
    const names = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .sort()
        .join(',');
    for (const [key, entry] of entries) {
      if (PLACEHOLDERS_DIFFER_BY_DESIGN.has(key)) continue;
      const expected = names(entry.ko);
      for (const lang of LANGUAGES) {
        expect(names(entry[lang]), `${key}.${lang} 자리표시자가 ko 와 다름`).toBe(expected);
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
