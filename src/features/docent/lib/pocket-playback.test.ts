import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyMediaSession, clearMediaSession, createSilentLoop } from './pocket-playback';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createSilentLoop', () => {
  it('createObjectURL 이 없는 환경(jsdom·일부 인앱)은 null — 재생 자체는 그대로 된다', () => {
    expect(createSilentLoop()).toBeNull();
  });

  it('무음 오디오를 반복으로 틀고, 멈추면 끈다', () => {
    const play = vi.fn(() => Promise.resolve());
    const pause = vi.fn();
    class FakeAudio {
      loop = false;
      paused = true;
      constructor(public src: string) {}
      play() {
        this.paused = false;
        return play();
      }
      pause() {
        this.paused = true;
        pause();
      }
    }
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:silence' });

    const loop = createSilentLoop();
    expect(loop).not.toBeNull();
    loop!.start();
    loop!.start(); // 이미 재생 중이면 다시 부르지 않는다
    expect(play).toHaveBeenCalledTimes(1);
    loop!.stop();
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it('play() 가 거절돼도(제스처 밖) 예외를 밖으로 내지 않는다', async () => {
    class FakeAudio {
      loop = false;
      paused = true;
      play() {
        return Promise.reject(new Error('NotAllowedError'));
      }
      pause() {}
    }
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:silence' });
    expect(() => createSilentLoop()!.start()).not.toThrow();
    await Promise.resolve();
  });
});

describe('applyMediaSession', () => {
  function fakeSession() {
    const handlers = new Map<string, (() => void) | null>();
    const session = {
      metadata: null as unknown,
      playbackState: 'none',
      setActionHandler: (action: string, fn: (() => void) | null) => handlers.set(action, fn),
    };
    vi.stubGlobal('navigator', { mediaSession: session });
    vi.stubGlobal(
      'MediaMetadata',
      class {
        constructor(public init: { title: string }) {}
      },
    );
    return { session, handlers };
  }

  it('API 가 없는 브라우저에서는 아무 일도 하지 않는다', () => {
    vi.stubGlobal('navigator', {});
    expect(() =>
      applyMediaSession(
        { title: 't', onPlay: () => {}, onPause: () => {}, onNext: null, onPrevious: null },
        true,
      ),
    ).not.toThrow();
  });

  it('잠금화면 제목·재생 상태·버튼을 연결하고, 끝 챕터에서는 다음 버튼을 감춘다', () => {
    const { session, handlers } = fakeSession();
    const onPause = vi.fn();
    applyMediaSession(
      { title: '여는 말', onPlay: () => {}, onPause, onNext: null, onPrevious: () => {} },
      true,
    );
    expect((session.metadata as { init: { title: string } }).init.title).toBe('여는 말');
    expect(session.playbackState).toBe('playing');
    handlers.get('pause')!();
    expect(onPause).toHaveBeenCalled();
    expect(handlers.get('nexttrack')).toBeNull();
    expect(handlers.get('previoustrack')).toBeTypeOf('function');
  });

  it('화면을 떠나면 버튼을 모두 비운다 — 남은 버튼이 엉뚱한 재생을 부르지 않게', () => {
    const { session, handlers } = fakeSession();
    applyMediaSession(
      { title: 't', onPlay: () => {}, onPause: () => {}, onNext: () => {}, onPrevious: null },
      true,
    );
    clearMediaSession();
    expect(session.playbackState).toBe('none');
    expect(handlers.get('play')).toBeNull();
    expect(handlers.get('nexttrack')).toBeNull();
  });
});
