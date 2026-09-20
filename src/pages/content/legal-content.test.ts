import { describe, expect, it } from 'vitest';
import { LANGUAGES } from '@/shared/i18n/dictionary';
import { FAQ } from '@/pages/content/faq';
import { PRIVACY } from '@/pages/content/privacy';
import { TERMS } from '@/pages/content/terms';

/**
 * 법무 문서는 여섯 언어가 같은 구조여야 한다 — 한 언어만 절이 빠지면 그 언어 이용자만
 * 다른 약속을 받는 셈이 된다 (2026-09-21).
 */
describe('법무 문서 6개 국어 구조', () => {
  it('개인정보 안내는 모든 언어가 같은 수의 절을 갖고 문의 이메일이 있다', () => {
    const count = PRIVACY.ko.items.length;
    for (const lang of LANGUAGES) {
      expect(PRIVACY[lang].items.length, lang).toBe(count);
      expect(PRIVACY[lang].items.map((s) => s.body).join(' '), lang).toContain(
        'visitholykorea@gmail.com',
      );
      expect(PRIVACY[lang].items.map((s) => s.body).join(' '), lang).toContain('2026-08-18');
    }
  });

  it('이용약관은 모든 언어가 같은 장·조 수를 갖는다', () => {
    const shape = TERMS.ko.chapters.map((c) => c.articles.length);
    for (const lang of LANGUAGES) {
      expect(
        TERMS[lang].chapters.map((c) => c.articles.length),
        lang,
      ).toEqual(shape);
      expect(TERMS[lang].effectiveDate, lang).toBeTruthy();
    }
  });

  it('FAQ 는 모든 언어가 같은 문답 수를 갖는다', () => {
    const shape = FAQ.ko.items.map((tab) => tab.length);
    for (const lang of LANGUAGES) {
      expect(
        FAQ[lang].items.map((tab) => tab.length),
        lang,
      ).toEqual(shape);
      expect(
        FAQ[lang].tabs.every((name) => name.trim().length > 0),
        lang,
      ).toBe(true);
    }
  });
});
