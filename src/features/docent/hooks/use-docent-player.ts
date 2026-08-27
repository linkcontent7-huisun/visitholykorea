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
export function useDocentPlayer(chapters: DocentChapter[], language: 'ko' | 'en') {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

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
    utterance.rate = 0.95;
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

  return { currentIndex, isPlaying, playFrom, toggle, stop };
}
