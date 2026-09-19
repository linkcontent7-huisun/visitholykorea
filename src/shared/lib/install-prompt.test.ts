import { afterEach, describe, expect, it, vi } from 'vitest';
import { isIos } from './install-prompt';

function mockNavigator(overrides: Partial<Navigator>) {
  vi.stubGlobal('navigator', { ...navigator, ...overrides });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isIos', () => {
  it('아이폰 User-Agent 면 true', () => {
    mockNavigator({
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    expect(isIos()).toBe(true);
  });

  it('"데스크톱 웹사이트로 보기"로 User-Agent 가 macOS 로 바뀐 아이폰·아이패드도 true', () => {
    mockNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 5,
    });
    expect(isIos()).toBe(true);
  });

  it('실제 맥(트랙패드, 터치스크린 없음)은 false', () => {
    mockNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });
    expect(isIos()).toBe(false);
  });

  it('안드로이드는 false', () => {
    mockNavigator({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911N) AppleWebKit/537.36',
      platform: 'Linux armv8l',
      maxTouchPoints: 5,
    });
    expect(isIos()).toBe(false);
  });
});
