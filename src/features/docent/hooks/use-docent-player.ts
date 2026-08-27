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
 * 모바일 방어 3가지 (2026-08-28, 실사용 "소리가 안 난다" 제보로 추가):
 * - 카카오톡 인앱 브라우저 등은 speechSynthesis 가 없거나 소리를 못 낸다
 *   → isSupported 로 알리고, 글 읽기 모드로 동작한다
 * - 안드로이드 크롬은 cancel() 직후의 speak() 를 무시하는 버그가 있다
 *   → 250ms 안에 시작되지 않으면 한 번 재시도한다
 * - 크롬은 참조가 사라진 utterance 를 GC 로 중간에 끊거나 긴 발화를 멈춘다
 *   → utterance 를 ref 로 붙잡고, 재생 중 10초마다 resume() 으로 깨운다
 */
/** 고령 순례자는 느리게, 익숙한 사용자는 빠르게 — 세 단계면 충분하다. */
export const SPEECH_RATES = [
  { key: 'slow', rate: 0.8 },
  { key: 'normal', rate: 0.95 },
  { key: 'fast', rate: 1.15 },
] as const;

export type SpeechRateKey = (typeof SPEECH_RATES)[number]['key'];

function detectSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  );
}

export function useDocentPlayer(chapters: DocentChapter[], language: Language) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [rateIndex, setRateIndex] = useState(1); // 보통에서 시작
  const rateRef = useRef<number>(SPEECH_RATES[1]!.rate);
  const isSupported = detectSupport();

  // cancel() 도 onend 를 부르는 브라우저가 있다 — 의도한 정지 뒤에 낡은
  // onend 가 다음 챕터를 재생하지 못하게, 재생 세션 번호로 구분한다.
  const sessionRef = useRef(0);
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;
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
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(chapter.narration);
    utteranceRef.current = utterance;
    // 영어 본문을 한국어 음성이 읽으면 알아들을 수 없다 — 언어를 맞춘다.
    utterance.lang = SPEECH_LOCALE[language];
    utterance.rate = rateRef.current;
    utterance.onend = () => {
      if (sessionRef.current !== session) return;
      const next = index + 1;
      if (next < chaptersRef.current.length) playFrom(next);
      else setIsPlaying(false);
    };
    utterance.onerror = () => {
      if (sessionRef.current !== session) return;
      setIsPlaying(false);
      setHasError(true);
    };
    window.speechSynthesis.speak(utterance);
    // 안드로이드 크롬: cancel 직후의 speak 가 무시되는 버그 — 시작 안 됐으면 한 번 재시도
    window.setTimeout(() => {
      if (sessionRef.current !== session) return;
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
        window.speechSynthesis.speak(utterance);
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
    hasError,
  };
}
