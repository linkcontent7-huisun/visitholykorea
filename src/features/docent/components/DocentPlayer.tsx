import { Gauge, Headphones, MapPin, Pause, Play } from 'lucide-react';
import type { DocentChapter } from '../lib/chapters';
import { useDocentPlayer, type SpeechRateKey } from '../hooks/use-docent-player';

const COPY = {
  ko: {
    title: '오디오 가이드',
    hint: '박물관 도슨트처럼, 둘러보는 동안 귀로 들으세요',
    draft: '초안 — 현장 확인 전',
    location: '찾아가는 길',
    lookFor: '눈여겨보기',
    play: '재생',
    pause: '멈춤',
    rateLabel: '읽는 속도',
    rates: { slow: '느리게', normal: '보통', fast: '빠르게' } satisfies Record<SpeechRateKey, string>,
  },
  en: {
    title: 'Audio Guide',
    hint: 'Listen as you walk, like a museum docent',
    draft: 'Draft — not field-verified',
    location: 'Where to find it',
    lookFor: 'Look for',
    play: 'Play',
    pause: 'Pause',
    rateLabel: 'Speed',
    rates: { slow: 'Slow', normal: 'Normal', fast: 'Fast' } satisfies Record<SpeechRateKey, string>,
  },
} as const;

interface DocentPlayerProps {
  chapters: DocentChapter[];
  isDraft: boolean;
  language: 'ko' | 'en';
}

/** 성지 상세의 챕터형 오디오 가이드. 챕터를 누르면 거기부터 이어 읽는다. */
export function DocentPlayer({ chapters, isDraft, language }: DocentPlayerProps) {
  const { currentIndex, isPlaying, playFrom, toggle, cycleRate, rateKey } = useDocentPlayer(
    chapters,
    language,
  );
  const copy = COPY[language];
  const current = chapters[currentIndex];

  if (chapters.length === 0 || !current) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-[28px] border border-app-border bg-app-bg">
      <div className="flex items-center gap-3 border-b border-app-border p-5">
        <button
          onClick={toggle}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all ${
            isPlaying
              ? 'bg-brand-violet text-white'
              : 'border border-app-border bg-white text-brand-violet'
          }`}
          aria-label={isPlaying ? copy.pause : copy.play}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Headphones size={14} className="shrink-0 text-brand-violet" />
            <h3 className="text-sm font-extrabold text-app-text">{copy.title}</h3>
            <span className="text-[11px] font-bold text-app-text-muted">
              {currentIndex + 1}/{chapters.length}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] font-medium text-app-text-muted">
            {copy.hint}
          </p>
        </div>
        {/* 문헌으로만 쓴 원고임을 정직하게 표시한다 — 더미 금지 원칙 */}
        {isDraft && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold text-amber-700">
            {copy.draft}
          </span>
        )}
        {/* 고령 사용자를 위한 속도 조절 — 느리게·보통·빠르게 순환 */}
        <button
          onClick={cycleRate}
          className="flex shrink-0 items-center gap-1 rounded-full border border-app-border bg-white px-2.5 py-1 text-[10px] font-extrabold text-app-text-muted"
          aria-label={`${copy.rateLabel}: ${copy.rates[rateKey]}`}
        >
          <Gauge size={12} />
          {copy.rates[rateKey]}
        </button>
      </div>

      {/* 지금 읽는 챕터의 전문 — 소리를 켤 수 없는 곳, 잘 들리지 않는 이들을 위해 */}
      <div className="border-b border-app-border bg-white/60 px-5 py-4">
        <p className="text-[13px] font-medium leading-relaxed text-app-text">
          {current.narration}
        </p>
      </div>

      <ol>
        {chapters.map((chapter, i) => {
          const isCurrent = i === currentIndex;
          return (
            <li key={chapter.id} className="border-b border-app-border/60 last:border-b-0">
              <button
                onClick={() => playFrom(i)}
                aria-current={isCurrent}
                className={`flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors ${
                  isCurrent ? 'bg-brand-violet/5' : 'hover:bg-white'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                    isCurrent
                      ? 'bg-brand-violet text-white'
                      : 'bg-app-border/60 text-app-text-muted'
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-sm font-bold ${
                      isCurrent ? 'text-brand-violet' : 'text-app-text'
                    }`}
                  >
                    {chapter.title}
                  </span>
                  {/* 걸으면서 힐끗 보는 안내 — 어디로 가서 무엇을 볼지 */}
                  {chapter.location && (
                    <span className="mt-1 flex items-start gap-1 text-[11px] font-medium leading-relaxed text-app-text-muted">
                      <MapPin size={12} className="mt-0.5 shrink-0" />
                      {copy.location}: {chapter.location}
                    </span>
                  )}
                  {chapter.lookFor && (
                    <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-app-text-muted">
                      👁 {copy.lookFor}: {chapter.lookFor}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
