import { beforeEach, describe, expect, it, vi } from 'vitest';

/** 모듈이 로드될 때 window 이벤트를 잡으므로 매 테스트마다 새로 불러온다. */
async function load(ua: string, standalone = false) {
  vi.resetModules();
  Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true });
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (q: string) => ({ matches: standalone && q.includes('standalone'), addEventListener() {}, removeEventListener() {} }),
  });
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
