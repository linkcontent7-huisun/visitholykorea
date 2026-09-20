import { describe, expect, it } from 'vitest';
import { resolveInitialLanguage } from './language-default';

describe('resolveInitialLanguage — 첫 화면 언어', () => {
  it('저장된 선택이 있으면 브라우저 언어보다 우선한다', () => {
    expect(resolveInitialLanguage('en', ['ko-KR'])).toBe('en');
    expect(resolveInitialLanguage('ko', ['en-US'])).toBe('ko');
  });

  it('처음 온 사람은 브라우저 언어가 켜진 언어면 그 언어, 아니면 영어', () => {
    expect(resolveInitialLanguage(null, ['ko-KR', 'en'])).toBe('ko');
    expect(resolveInitialLanguage(null, ['it-IT'])).toBe('it');
    expect(resolveInitialLanguage(null, ['pt-BR'])).toBe('pt');
    expect(resolveInitialLanguage(null, ['ja-JP'])).toBe('en');
    expect(resolveInitialLanguage(null, ['ko'])).toBe('ko');
    expect(resolveInitialLanguage(null, ['es-ES'])).toBe('es');
    expect(resolveInitialLanguage(null, [])).toBe('en');
  });

  it('여섯 언어가 모두 켜져 있으므로 저장된 es·fr 도 그대로 쓴다 (2026-09-20)', () => {
    expect(resolveInitialLanguage('es', ['es-ES'])).toBe('es');
    expect(resolveInitialLanguage('fr', ['ko-KR'])).toBe('fr');
  });

  it('손댄 값·모르는 값은 무시하고 브라우저 언어로 정한다', () => {
    expect(resolveInitialLanguage('xx', ['ko-KR'])).toBe('ko');
  });
});
