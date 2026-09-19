import { describe, expect, it } from 'vitest';
import { isMobileBrowser } from './auth';

describe('isMobileBrowser — 카카오톡 간편로그인 분기', () => {
  it('안드로이드·아이폰은 스마트폰으로 본다', () => {
    expect(isMobileBrowser('Mozilla/5.0 (Linux; Android 14; SM-S921N) Chrome/140 Mobile')).toBe(true);
    expect(isMobileBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari')).toBe(true);
  });
  it('PC 크롬·맥 사파리는 아니다', () => {
    expect(isMobileBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140')).toBe(false);
    expect(isMobileBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari')).toBe(false);
  });
});
