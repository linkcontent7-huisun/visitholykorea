import { useEffect, useRef, useState } from 'react';
import type { DocentChapter } from '../lib/chapters';

/**
 * 챕터를 순서대로 읽어주는 재생기.
 *
 * 브라우저 내장 TTS(speechSynthesis)를 쓴다 — 별도 비용·서버가 없다.
 * 일시정지는 pause/resume 대신 **정지 후 같은 챕터 처음부터 다시 재생**으로
 * 구현했다. iOS 사파리에서 pause() 가 자주 먹통이 되는데, 챕터가 3~6문장이라
 * 처음부터 다시 들어도 잃는 것이 적다.
 */
/** 고령 순례자는 느리게, 익숙한 사용자는 빠르게 — 세 단계면 충분하다. */
export const SPEECH_RATES = [
  { key: 'slow', rate: 0.8 },
  { key: 'normal', rate: 0.95 },
  { key: 'fast', rate: 1.15 },
] as const;

export type SpeechRateKey = (typeof SPEECH_RATES)[number]['key'];

export function useDocentPlayer(chapters: DocentChapter[], language: 'ko' | 'en') {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rateIndex, setRateIndex] = useState(1); // 보통에서 시작
  const rateRef = useRef(SPEECH_RATES[1]!.rate);

  // cancel() 도 onend 를 부르는 브라우저가 있다 — 의도한 정지 뒤에 낡은
  // onend 가 다음 챕터를 재생하지 못하게, 재생 세션 번호로 구분한다.
  const sessionRef = useRef(0);
  const chaptersRef = useRef(chapters);
  chaptersRef.current = chapters;

  // 화면을 나가거나 성지(챕터 목록)가 바뀌면 읽던 음성을 멈춘다.
  useEffect(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
    return () => {
      sessionRef.current += 1;
      window.speechSynthesis?.cancel();
    };
  }, [chapters]);

  const playFrom = (index: number) => {
    const chapter = chaptersRef.current[index];
    if (!chapter) return;
    sessionRef.current += 1;
    const session = sessionRef.current;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(chapter.narration);
    // 영어 본문을 한국어 음성이 읽으면 알아들을 수 없다 — 언어를 맞춘다.
    utterance.lang = language === 'en' ? 'en-US' : 'ko-KR';
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
    };
    window.speechSynthesis.speak(utterance);
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const stop = () => {
    sessionRef.current += 1;
    window.speechSynthesis.cancel();
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
  };
}
