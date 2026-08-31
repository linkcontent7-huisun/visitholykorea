import { useEffect, useRef, useState } from 'react';
import { SPEECH_LOCALE, type Language } from '@/shared/i18n/dictionary';
import type { DocentChapter } from '../lib/chapters';

/**
 * 챕터를 순서대로 읽어주는 재생기.
 *
 * 브라우저 내장 TTS(speechSynthesis)를 쓴다 — 별도 비용·서버가 없다.
 * 일시정지는 pause/resume 대신 **정지 후 같은 챕터 처음부터 다시 재생**으로
 * 구현했다. iOS 사파리에서 pause() 가 자주 먹통이 되는데, 챕터가 3~6문장이라
 * 처음부터 다시 들어도 잃는 것이 적다.
 *
 * 모바일 방어 (2026-08-28 1차, 2026-08-31 2차 — 실사용 "소리가 안 난다" 제보):
 * - 카카오톡 인앱 브라우저 등은 speechSynthesis 가 없거나 소리를 못 낸다
 *   → isSupported 로 알리고, 글 읽기 모드로 동작한다
 * - 안드로이드 크롬은 cancel() 직후의 speak() 를 무시하는 버그가 있다
 *   → 250ms 안에 시작되지 않으면 **새 utterance 로** 한 번 재시도한다
 * - 크롬은 참조가 사라진 utterance 를 GC 로 중간에 끊거나 긴 발화를 멈춘다
 *   → utterance 를 ref 로 붙잡고, 재생 중 10초마다 resume() 으로 깨운다
 * - 음성 목록은 비동기로 채워진다 (첫 호출에 빈 배열) → voiceschanged 를 기다린다
 * - 기기에 해당 언어 음성이 없으면 소리가 안 나거나 엉뚱한 발음이 된다
 *   → 언어에 맞는 음성을 직접 골라 물리고, 없으면 그 사실을 따로 알린다
 */
/** 고령 순례자는 느리게, 익숙한 사용자는 빠르게 — 세 단계면 충분하다. */
export const SPEECH_RATES = [
  { key: 'slow', rate: 0.8 },
  { key: 'normal', rate: 0.95 },
  { key: 'fast', rate: 1.15 },
] as const;

export type SpeechRateKey = (typeof SPEECH_RATES)[number]['key'];

/** 사용자가 멈췄을 때도 브라우저는 error 를 던진다 — 이건 고장이 아니다. */
const BENIGN_ERRORS = new Set(['interrupted', 'canceled', 'cancelled']);

function detectSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

/**
 * 같은 언어라도 기기에는 낡은 합성음과 신경망 음성이 섞여 있다.
 * "기계 목소리 같다"는 제보(2026-08-31)의 대부분은 낡은 쪽이 걸려서다.
 * 이름에 아래 표시가 있으면 최신 음성이므로 먼저 고른다.
 */
const NATURAL_VOICE_HINT = /natural|neural|online|google|siri|premium|enhanced|wavenet/i;

/**
 * 로케일에 맞는 음성을 고른다. 언어가 맞는 것 중 **자연스러운 음성 우선**,
 * ko-KR 정확히 일치 → ko 로 시작 → 없으면 null.
 *
 * 기기 기본 음성에 맡기면 한국어 문장을 영어 음성이 읽어버리는 일이 잦다.
 * (안드로이드에서 한국어 TTS 데이터를 안 받은 기기가 실제로 그렇다.)
 */
export function pickVoice(
  voices: SpeechSynthesisVoice[],
  locale: string,
): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const want = locale.toLowerCase();
  const base = want.split('-')[0]!;
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-');

  const exact = voices.filter((v) => norm(v) === want);
  const sameLang = voices.filter((v) => norm(v) === base || norm(v).startsWith(base + '-'));
  const best = (list: SpeechSynthesisVoice[]) =>
    list.find((v) => NATURAL_VOICE_HINT.test(v.name)) ?? list[0] ?? null;

  return best(exact) ?? best(sameLang);
}

/**
 * 한 챕터를 문장 단위로 끊는다.
 *
 * 긴 문단을 통째로 넘기면 합성기가 쉼 없이 밀어붙여 기계처럼 들린다.
 * 문장마다 따로 발화하면 사이에 자연스러운 호흡이 생기고, 중간에 멈추기도 쉽다.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?。？！])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 음성 목록은 비동기로 채워진다. 준비될 때까지 구독한다. */
function useVoices(isSupported: boolean): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!isSupported) return;
    // getVoices 를 갖추지 않은 구현(테스트 더블·일부 인앱 브라우저)에서도 죽지 않는다
    const read = () => {
      const list = window.speechSynthesis?.getVoices?.() ?? [];
      if (list.length > 0) setVoices(list);
    };
    read();
    window.speechSynthesis?.addEventListener?.('voiceschanged', read);
    // voiceschanged 를 안 쏘는 브라우저가 있어 초반에 몇 번 더 확인한다
    const timers = [250, 750, 1500].map((ms) => window.setTimeout(read, ms));
    return () => {
      window.speechSynthesis?.removeEventListener?.('voiceschanged', read);
      timers.forEach(window.clearTimeout);
    };
  }, [isSupported]);

  return voices;
}

export function useDocentPlayer(chapters: DocentChapter[], language: Language) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [rateIndex, setRateIndex] = useState(1); // 보통에서 시작
  const rateRef = useRef<number>(SPEECH_RATES[1]!.rate);
  const isSupported = detectSupport();
  const voices = useVoices(isSupported);

  const locale = SPEECH_LOCALE[language];
  const voice = pickVoice(voices, locale);
  /** 목록을 받았는데도 그 언어 음성이 없으면, 눌러도 소리가 안 날 것을 미리 안다. */
  const isVoiceMissing = isSupported && voices.length > 0 && voice === null;

  // cancel() 도 onend 를 부르는 브라우저가 있다 — 의도한 정지 뒤에 낡은
  // onend 가 다음 챕터를 재생하지 못하게, 재생 세션 번호로 구분한다.
  const sessionRef = useRef(0);
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;
  const voiceRef = useRef<SpeechSynthesisVoice | null>(voice);
  voiceRef.current = voice;
  const localeRef = useRef(locale);
  localeRef.current = locale;
  // 크롬이 지역변수 utterance 를 GC 로 수거해 소리가 끊기는 버그 방지
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 화면을 나가거나 성지(챕터 목록)가 바뀌면 읽던 음성을 멈춘다.
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    return () => {
      sessionRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, [chapters]);

  // 크롬이 긴 발화를 일시정지 상태로 멈춰버리는 버그 — 재생 중에는 주기적으로 깨운다
  useEffect(() => {
    if (!isPlaying || !isSupported) return;
    const keepalive = window.setInterval(() => window.speechSynthesis.resume(), 10000);
    return () => window.clearInterval(keepalive);
  }, [isPlaying, isSupported]);

  const playFrom = (index: number) => {
    const chapter = chaptersRef.current[index];
    if (!chapter) return;
    // 음성이 없는 브라우저(카카오톡 인앱 등)에서도 챕터 본문 읽기는 되게 한다
    if (!isSupported) {
      setCurrentIndex(index);
      return;
    }
    sessionRef.current += 1;
    const session = sessionRef.current;
    setHasError(false);

    // 문장 단위로 끊어 읽어야 사이에 호흡이 생긴다 (한 문단 통짜는 기계처럼 들린다)
    const sentences = splitSentences(chapter.narration);

    /**
     * 매번 새 utterance 를 만든다. 이미 한 번 speak 에 넘긴 객체를 다시 넘기면
     * 사파리·크롬이 error 를 던지거나 두 번 읽는다 — 재시도가 오히려 고장을
     * 만들던 원인이었다.
     */
    const build = (sentenceIndex: number) => {
      const u = new SpeechSynthesisUtterance(sentences[sentenceIndex] ?? chapter.narration);
      // 영어 본문을 한국어 음성이 읽으면 알아들을 수 없다 — 언어를 맞춘다.
      u.lang = localeRef.current;
      if (voiceRef.current) u.voice = voiceRef.current;
      u.rate = rateRef.current;
      u.onend = () => {
        if (sessionRef.current !== session) return;
        const nextSentence = sentenceIndex + 1;
        if (nextSentence < sentences.length) {
          window.speechSynthesis.speak(build(nextSentence));
          return;
        }
        const next = index + 1;
        if (next < chaptersRef.current.length) playFrom(next);
        else setIsPlaying(false);
      };
      u.onerror = (event) => {
        if (sessionRef.current !== session) return;
        // 사용자가 멈춰서 난 error 를 고장으로 표시하지 않는다
        if (event?.error && BENIGN_ERRORS.has(event.error)) return;
        setIsPlaying(false);
        setHasError(true);
      };
      utteranceRef.current = u;
      return u;
    };

    // 읽고 있을 때만 취소한다. 조용한데 부르는 cancel() 은 크롬에서 바로 뒤의
    // speak() 를 삼키는 원인이 된다.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
    window.speechSynthesis.speak(build(0));
    // 안드로이드 크롬: cancel 직후의 speak 가 무시되는 버그 — 시작 안 됐으면 한 번 재시도
    window.setTimeout(() => {
      if (sessionRef.current !== session) return;
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        window.speechSynthesis.speak(build(0));
      }
    }, 250);
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const stop = () => {
    sessionRef.current += 1;
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
  };

  const toggle = () => {
    if (isPlaying) stop();
    else playFrom(currentIndex);
  };

  /** 느리게 → 보통 → 빠르게 순환. 재생 중이면 현재 챕터를 새 속도로 다시 읽는다. */
  const cycleRate = () => {
    const next = (rateIndex + 1) % SPEECH_RATES.length;
    setRateIndex(next);
    rateRef.current = SPEECH_RATES[next]!.rate;
    if (isPlaying) playFrom(currentIndex);
  };

  return {
    currentIndex,
    isPlaying,
    playFrom,
    toggle,
    stop,
    cycleRate,
    rateKey: SPEECH_RATES[rateIndex]!.key,
    isSupported,
    isVoiceMissing,
    hasError,
  };
}
