import { describe, expect, it } from 'vitest';
import { koreaTodayYmd } from './korea-date';

describe('koreaTodayYmd — 한국 날짜 YYYYMMDD', () => {
  it('UTC 자정 직전은 한국에선 이미 다음 날이다', () => {
    expect(koreaTodayYmd(new Date('2026-09-20T23:30:00Z'))).toBe('20260921');
  });
  it('UTC 오전은 한국에서도 같은 날', () => {
    expect(koreaTodayYmd(new Date('2026-09-21T03:00:00Z'))).toBe('20260921');
  });
});
