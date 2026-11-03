import { describe, expect, it } from 'vitest';
import { titleFromHeading } from './document-title';

describe('titleFromHeading', () => {
  it('화면 제목 뒤에 앱 이름을 붙인다', () => {
    expect(titleFromHeading('성지 찾기', '/search')).toBe('성지 찾기 | Visit Holy Korea');
    expect(titleFromHeading('  자주 묻는\n 질문 ', '/faq')).toBe('자주 묻는 질문 | Visit Holy Korea');
  });
  it('홈·빈 제목·이미 앱 이름인 제목은 바꾸지 않는다', () => {
    expect(titleFromHeading('무엇이든', '/')).toBeNull();
    expect(titleFromHeading('', '/records')).toBeNull();
    expect(titleFromHeading(undefined, '/records')).toBeNull();
    expect(titleFromHeading('Visit Holy Korea — 소개', '/x')).toBeNull();
  });
});
