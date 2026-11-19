import { afterEach, describe, expect, it, vi } from 'vitest';
import { DING_VOLUME, playCorrectDing, resetDingForTest } from './correct-ding';

function fakeAudioContext() {
  const peaks: number[] = [];
  const freqs: number[] = [];
  class FakeCtx {
    state = 'running';
    currentTime = 0;
    destination = {};
    resume = () => Promise.resolve();
    createOscillator() {
      const osc = {
        type: '',
        frequency: {
          set value(v: number) {
            freqs.push(v);
          },
        },
        connect: () => {},
        start: () => {},
        stop: () => {},
      };
      return osc;
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: () => {},
          exponentialRampToValueAtTime: (v: number) => peaks.push(v),
        },
        connect: () => {},
      };
    }
  }
  return { FakeCtx, peaks, freqs };
}

afterEach(() => {
  vi.unstubAllGlobals();
  resetDingForTest();
});

describe('정답 딩동 소리 (2026-11-20)', () => {
  it('높은 음 → 낮은 음 두 번, 가장 큰 소리도 정한 작은 음량을 넘지 않는다', () => {
    const { FakeCtx, peaks, freqs } = fakeAudioContext();
    vi.stubGlobal('AudioContext', FakeCtx);
    playCorrectDing();
    expect(freqs).toHaveLength(2);
    expect(freqs[0]!).toBeGreaterThan(freqs[1]!);
    expect(Math.max(...peaks)).toBe(DING_VOLUME);
    expect(DING_VOLUME).toBeLessThanOrEqual(0.1);
  });

  it('소리를 못 내는 브라우저에서도 오류 없이 넘어간다', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);
    expect(() => playCorrectDing()).not.toThrow();
  });

  it('소리 재생이 막혀 오류가 나도 퀴즈를 멈추지 않는다', () => {
    vi.stubGlobal(
      'AudioContext',
      class {
        constructor() {
          throw new Error('NotAllowedError');
        }
      },
    );
    expect(() => playCorrectDing()).not.toThrow();
  });
});
