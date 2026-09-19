import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

/** 모듈이 로드될 때 window 이벤트를 잡으므로 상태 테스트는 매번 새로 불러온다. */
async function load(ua: string, standalone = false) {
  vi.resetModules();
  vi.stubGlobal('navigator', { ...navigator, userAgent: ua, platform: 'Linux', maxTouchPoints: 0 });
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: standalone && q.includes('standalone'), addEventListener() {}, removeEventListener() {} }));
  return import('./install-prompt');
}

describe('설치 상태(getInstallState)', () => {
  beforeEach(() => vi.resetModules());

  it('설치 창 이벤트가 오면 installable, 설치가 끝나면 unsupported(데스크톱 크롬)', async () => {
    const m = await load('Mozilla/5.0 (Windows NT 10.0) Chrome/140');
    expect(m.getInstallState()).toBe('unsupported');
    const seen: string[] = [];
    m.subscribeInstallState(() => seen.push(m.getInstallState()));
    const ev = Object.assign(new Event('beforeinstallprompt'), { prompt: async () => {}, userChoice: Promise.resolve({ outcome: 'accepted' }) });
    window.dispatchEvent(ev);
    expect(m.getInstallState()).toBe('installable');
    window.dispatchEvent(new Event('appinstalled'));
    expect(seen).toEqual(['installable', 'unsupported']);
  });

  it('아이폰 사파리는 ios, 카카오톡 안은 in-app, 홈 화면 앱은 installed', async () => {
    expect((await load('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari')).getInstallState()).toBe('ios');
    expect((await load('Mozilla/5.0 (Linux; Android 14) KAKAOTALK')).getInstallState()).toBe('in-app');
    expect((await load('Mozilla/5.0 (Linux; Android 14) Chrome/140', true)).getInstallState()).toBe('installed');
  });
});
