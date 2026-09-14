import { describe, expect, it } from 'vitest';
import { resolveInitialLanguage } from './language-default';

describe('resolveInitialLanguage — 첫 화면 언어', () => {
  it('저장된 선택이 있으면 브라우저 언어보다 우선한다', () => {
    expect(resolveInitialLanguage('en', ['ko-KR'])).toBe('en');
    expect(resolveInitialLanguage('ko', ['en-US'])).toBe('ko');
  });

  it('처음 온 사람은 브라우저가 한국어면 한국어, 아니면 영어', () => {
    expect(resolveInitialLanguage(null, ['ko-KR', 'en'])).toBe('ko');
    expect(resolveInitialLanguage(null, ['ko'])).toBe('ko');
    expect(resolveInitialLanguage(null, ['es-ES'])).toBe('en');
    expect(resolveInitialLanguage(null, [])).toBe('en');
  });

  it('검수 전이라 숨긴 언어가 저장돼 있으면 영어로 제안한다', () => {
    expect(resolveInitialLanguage('es', ['es-ES'])).toBe('en');
    expect(resolveInitialLanguage('fr', ['ko-KR'])).toBe('en');
  });

  it('손댄 값·모르는 값은 무시하고 브라우저 언어로 정한다', () => {
    expect(resolveInitialLanguage('xx', ['ko-KR'])).toBe('ko');
  });
});
