/**
 * 주머니 재생 — 화면을 꺼도 도슨트가 끊기지 않게 하는 두 장치.
 *
 * 브라우저 TTS(speechSynthesis)는 "탭이 활성 상태"일 때만 보장된다. 화면이
 * 잠기면 OS 가 탭을 재워 소리가 멈춘다. 그런데 **오디오를 재생 중인 탭**은
 * 재우지 않는다(음악 앱과 같은 취급). 그래서 재생 중에만 무음 오디오를 반복
 * 틀어 탭을 "오디오 재생 중"으로 만든다 — 화면 변경 없이 되는 가장 싼 방법.
 *
 * 같은 이유로 OS 는 오디오 재생 중인 탭에 잠금화면 재생 버튼을 준다
 * (Media Session API). 제목과 ▶︎ ⏸ ⏭ ⏮ 를 연결해 두면 주머니에서 꺼내지 않고
 * 이어폰 버튼·잠금화면으로 조작할 수 있다.
 *
 * 실측 한계(2026-10-12, 기기 검증 전): 안드로이드 크롬은 이 방식으로 잠금
 * 뒤에도 TTS 가 이어지는 사례가 많다. iOS 사파리는 잠금 시 TTS 를 끊는 경우가
 * 있어 **확인 필요** — 그 경우는 화면 복귀 시 재개(훅의 visibilitychange)로
 * 받는다. 어느 쪽도 지원이 없으면 조용히 아무것도 안 한다.
 */

/** 무음 WAV 를 메모리에서 만든다 — 파일을 번들에 싣지 않아도 된다. */
function buildSilentWav(seconds: number): Blob {
  const sampleRate = 8000; // 무음이라 음질은 무의미 — 가장 작은 크기로
  const samples = sampleRate * seconds;
  const buffer = new ArrayBuffer(44 + samples);
  const view = new DataView(buffer);
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt 청크 길이
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 모노
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true); // 바이트/초 (8비트 모노)
  view.setUint16(32, 1, true); // 블록 정렬
  view.setUint16(34, 8, true); // 8비트
  ascii(36, 'data');
  view.setUint32(40, samples, true);
  // 8비트 PCM 의 무음은 0 이 아니라 128(중앙값)이다 — 0 이면 "딱" 소리가 난다
  new Uint8Array(buffer, 44).fill(128);
  return new Blob([buffer], { type: 'audio/wav' });
}

export interface SilentLoop {
  /** 사용자 동작(버튼 클릭) 안에서 불러야 한다 — 모바일은 그 밖의 재생을 막는다 */
  start: () => void;
  stop: () => void;
}

/**
 * 무음 반복 재생기. 지원이 없는 환경(jsdom·일부 인앱 브라우저)은 null.
 * play() 가 거절돼도(제스처 밖에서 호출 등) 조용히 넘어간다 — TTS 는
 * 그대로 들리고, 잠금 뒤 유지만 안 되는 것이므로 고장으로 보이지 않는다.
 */
export function createSilentLoop(): SilentLoop | null {
  if (
    typeof Audio !== 'function' ||
    typeof URL === 'undefined' ||
    typeof URL.createObjectURL !== 'function'
  ) {
    return null;
  }
  let audio: HTMLAudioElement | null = null;
  const ensure = () => {
    if (audio) return audio;
    audio = new Audio(URL.createObjectURL(buildSilentWav(1)));
    audio.loop = true;
    // iOS 는 volume 을 못 바꾼다 — 샘플 자체가 무음이라 굳이 필요 없다
    return audio;
  };
  return {
    start: () => {
      const el = ensure();
      if (!el.paused) return;
      const result = el.play();
      // 오래된 브라우저는 play() 가 Promise 를 안 준다
      if (result && typeof result.catch === 'function') result.catch(() => {});
    },
    stop: () => {
      if (!audio || audio.paused) return;
      audio.pause();
    },
  };
}

export interface MediaSessionHandlers {
  title: string;
  onPlay: () => void;
  onPause: () => void;
  onNext: (() => void) | null;
  onPrevious: (() => void) | null;
}

/** 잠금화면·이어폰 버튼을 도슨트 조작에 연결한다. API 가 없으면 아무것도 안 한다. */
export function applyMediaSession(handlers: MediaSessionHandlers, isPlaying: boolean): void {
  const session = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
  if (!session) return;
  try {
    if (typeof MediaMetadata === 'function') {
      session.metadata = new MediaMetadata({ title: handlers.title, artist: 'VisitHolyKorea' });
    }
    session.playbackState = isPlaying ? 'playing' : 'paused';
    session.setActionHandler('play', handlers.onPlay);
    session.setActionHandler('pause', handlers.onPause);
    session.setActionHandler('stop', handlers.onPause);
    // 다음·이전이 없는 끝 챕터에서는 버튼을 감춘다(null 이 "지원 안 함")
    session.setActionHandler('nexttrack', handlers.onNext);
    session.setActionHandler('previoustrack', handlers.onPrevious);
  } catch {
    /* 일부 브라우저는 모르는 action 에 예외를 던진다 — 재생 자체는 영향 없다 */
  }
}

/** 화면을 떠날 때 잠금화면 버튼이 남아 엉뚱한 재생을 부르지 않게 비운다. */
export function clearMediaSession(): void {
  const session = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
  if (!session) return;
  try {
    session.metadata = null;
    session.playbackState = 'none';
    for (const action of ['play', 'pause', 'stop', 'nexttrack', 'previoustrack'] as const) {
      session.setActionHandler(action, null);
    }
  } catch {
    /* 위와 같다 */
  }
}
