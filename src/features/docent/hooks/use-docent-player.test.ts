import { describe, expect, it } from 'vitest';
import { pickVoice, splitSentences } from './use-docent-player';

/** getVoices() 가 주는 목록을 흉내 낸다 — 이름과 lang 만 있으면 충분하다. */
function voice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice;
}

describe('pickVoice', () => {
  it('언어가 맞는 음성이 없으면 null 을 준다 — 눌러도 소리가 안 날 것을 미리 알 수 있다', () => {
    expect(pickVoice([voice('Samantha', 'en-US')], 'ko-KR')).toBeNull();
  });

  it('목록이 비어 있으면 null 을 준다 (음성이 아직 안 실린 상태)', () => {
    expect(pickVoice([], 'ko-KR')).toBeNull();
  });

  it('로케일이 정확히 맞는 음성을 고른다 — 기본 음성에 맡기면 엉뚱한 언어로 읽는다', () => {
    const picked = pickVoice([voice('Samantha', 'en-US'), voice('Heami', 'ko-KR')], 'ko-KR');
    expect(picked?.name).toBe('Heami');
  });

  it('같은 언어라면 신경망 음성을 낡은 합성음보다 먼저 고른다', () => {
    const picked = pickVoice(
      [voice('Microsoft Heami', 'ko-KR'), voice('Microsoft SunHi Online (Natural)', 'ko-KR')],
      'ko-KR',
    );
    expect(picked?.name).toBe('Microsoft SunHi Online (Natural)');
  });

  it('지역이 달라도 같은 언어면 받아들인다 — pt-PT 밖에 없어도 읽어준다', () => {
    const picked = pickVoice([voice('Joana', 'pt-PT')], 'pt-BR');
    expect(picked?.name).toBe('Joana');
  });

  it('lang 표기가 밑줄(ko_KR)인 안드로이드 기기도 인식한다', () => {
    expect(pickVoice([voice('Korean', 'ko_KR')], 'ko-KR')?.name).toBe('Korean');
  });
});

describe('splitSentences', () => {
  it('문장 단위로 끊는다 — 한 문단을 통째로 넘기면 쉼 없이 읽어 기계처럼 들린다', () => {
    expect(splitSentences('첫 문장입니다. 둘째 문장입니다.')).toEqual([
      '첫 문장입니다.',
      '둘째 문장입니다.',
    ]);
  });

  it('물음표·느낌표에서도 끊는다', () => {
    expect(splitSentences('보이시나요? 놀랍습니다!')).toEqual(['보이시나요?', '놀랍습니다!']);
  });

  it('문장 부호가 없으면 통째로 하나로 둔다', () => {
    expect(splitSentences('끝맺음 없는 문장')).toEqual(['끝맺음 없는 문장']);
  });

  it('빈 문자열은 빈 배열 — 재생할 것이 없다', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});

/* ───────── 주머니 재생(2026-10-12): 잠금화면 버튼 · 화면 복귀 시 재개 ───────── */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { useDocentPlayer } from './use-docent-player';
import type { DocentChapter } from '../lib/chapters';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error?: string }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

const chapters: DocentChapter[] = [
  { id: 'a', title: '첫 챕터', narration: '첫 문장. 둘째 문장.', location: null, lookFor: null },
  { id: 'b', title: '둘째 챕터', narration: '다음 본문.', location: null, lookFor: null },
];

describe('useDocentPlayer — 주머니 재생', () => {
  const speech = {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    speaking: false,
    pending: false,
    getVoices: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  const handlers = new Map<string, (() => void) | null>();

  beforeEach(() => {
    vi.useFakeTimers();
    speech.speaking = false;
    speech.pending = false;
    handlers.clear();
    vi.stubGlobal('speechSynthesis', speech);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('MediaMetadata', class {});
    // jsdom 의 navigator 를 통째로 바꾸면 다른 코드가 깨진다 — 속성만 얹는다
    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: {
        metadata: null,
        playbackState: 'none',
        setActionHandler: (a: string, fn: (() => void) | null) => handlers.set(a, fn),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  const spoken = () => (speech.speak.mock.calls as [FakeUtterance][]).map(([u]) => u.text);

  it('잠금화면의 일시정지 버튼이 재생을 멈춘다', () => {
    const { result } = renderHook(() => useDocentPlayer(chapters, 'ko'));
    act(() => result.current.playFrom(0));
    expect(result.current.isPlaying).toBe(true);
    expect(handlers.get('pause')).toBeTypeOf('function');

    act(() => handlers.get('pause')!());
    expect(result.current.isPlaying).toBe(false);
    expect(speech.cancel).toHaveBeenCalled();
  });

  it('잠금화면의 다음 버튼은 다음 챕터로, 마지막 챕터에서는 다음 버튼이 없다', () => {
    const { result } = renderHook(() => useDocentPlayer(chapters, 'ko'));
    act(() => result.current.playFrom(0));
    act(() => handlers.get('nexttrack')!());
    expect(result.current.currentIndex).toBe(1);
    expect(handlers.get('nexttrack')).toBeNull();
    expect(handlers.get('previoustrack')).toBeTypeOf('function');
  });

  it('화면 복귀 시 조용하면 읽던 문장부터 다시 읽는다 — OS 가 잠금 중 TTS 를 끊은 경우', () => {
    const { result } = renderHook(() => useDocentPlayer(chapters, 'ko'));
    act(() => result.current.playFrom(0));
    expect(spoken()).toEqual(['첫 문장.']);
    // 읽기가 정상 시작된 상태 — 안드로이드용 250ms 재시도가 끼어들지 않게
    speech.speaking = true;
    act(() => vi.advanceTimersByTime(250));

    // 첫 문장이 끝나 둘째 문장으로 넘어간 상태에서 화면이 잠겼다가 돌아온다
    const first = speech.speak.mock.calls[0]![0] as FakeUtterance;
    act(() => first.onend?.());
    expect(spoken()).toEqual(['첫 문장.', '둘째 문장.']);

    speech.speaking = false; // OS 가 끊어 조용해진 상태
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(300);
    });
    expect(spoken()).toEqual(['첫 문장.', '둘째 문장.', '둘째 문장.']);
  });

  it('화면 복귀 시 아직 읽고 있으면 다시 읽지 않는다(두 번 들리면 안 된다)', () => {
    const { result } = renderHook(() => useDocentPlayer(chapters, 'ko'));
    act(() => result.current.playFrom(0));
    speech.speaking = true;
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(300);
    });
    expect(spoken()).toEqual(['첫 문장.']);
  });

  it('사용자가 멈춘 뒤 화면이 돌아와도 다시 읽지 않는다', () => {
    const { result } = renderHook(() => useDocentPlayer(chapters, 'ko'));
    act(() => result.current.playFrom(0));
    act(() => result.current.stop());
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      vi.advanceTimersByTime(300);
    });
    expect(spoken()).toEqual(['첫 문장.']);
  });
});
