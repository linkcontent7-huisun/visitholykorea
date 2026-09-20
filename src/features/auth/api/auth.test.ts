import { describe, expect, it } from 'vitest';
import { isMobileBrowser, mailLanguage } from './auth';

describe('isMobileBrowser — 카카오톡 간편로그인 분기', () => {
  it('안드로이드·아이폰은 스마트폰으로 본다', () => {
    expect(isMobileBrowser('Mozilla/5.0 (Linux; Android 14; SM-S921N) Chrome/140 Mobile')).toBe(
      true,
    );
    expect(isMobileBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari')).toBe(
      true,
    );
  });
  it('PC 크롬·맥 사파리는 아니다', () => {
    expect(isMobileBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140')).toBe(false);
    expect(isMobileBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari')).toBe(false);
  });
});

describe('mailLanguage — 인증 메일 언어', () => {
  it('화면에서 고른 언어를 그대로 메일 서식에 넘긴다', () => {
    expect(mailLanguage('ko')).toBe('ko');
    expect(mailLanguage('it')).toBe('it');
  });
  it('모르는 값·빈 값은 영어로 보낸다 — 서식이 못 알아보면 한글이 깨진 채 나간다', () => {
    expect(mailLanguage('')).toBe('en');
    expect(mailLanguage('zh')).toBe('en');
  });
});
