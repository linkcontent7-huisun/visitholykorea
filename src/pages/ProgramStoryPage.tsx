import { useQuery } from '@tanstack/react-query';
import { Pause, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { fetchMyApplication } from '@/features/programs/api/applications.repository';
import { QuizCard } from '@/features/programs/components/QuizCard';
import { StoryScene } from '@/features/programs/components/StoryScenes';
import {
  BREAD_QUIZ,
  BREAD_STORY,
  STORY_SOURCES,
  type StoryEpisode,
} from '@/features/programs/data/bread-story';
import { findProgram } from '@/features/programs/data/programs';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';

/**
 * 줄에서 보는 이야기 (2026-11-08) — 웹소설 말투 + 웹툰 칸.
 * 「듣기」는 휴대폰에 들어 있는 읽기 기능(speechSynthesis)을 쓴다 — 비용 없음, 없으면 버튼을 숨긴다.
 */
export default function ProgramStoryPage() {
  const { programSlug } = useParams<{ programSlug: string }>();
  const program = findProgram(programSlug);
  const [reading, setReading] = useState<number | null>(null);
  // 나의 체험 링크에서 들어오면 ?a=<접수 id> — 그때만 포인트가 쌓인다
  const [params] = useSearchParams();
  const applicationId = params.get('a') ?? undefined;
  const { data: mine } = useQuery({
    queryKey: ['my-program-application', applicationId],
    queryFn: () => fetchMyApplication(applicationId!),
    enabled: !!applicationId,
  });
  const [points, setPoints] = useState<number | null>(null);
  const shownPoints = points ?? mine?.points ?? 0;
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(
    () => () => {
      if (canSpeak) window.speechSynthesis.cancel();
    },
    [canSpeak],
  );

  function toggle(ep: StoryEpisode) {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    if (reading === ep.no) {
      setReading(null);
      return;
    }
    const text = ep.panels
      .flatMap((p) => [...p.lines, ...(p.bubble ? [p.bubble] : [])])
      .concat(ep.next)
      .join(' ');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.95;
    u.onend = () => setReading(null);
    setReading(ep.no);
    window.speechSynthesis.speak(u);
  }

  if (!program) {
    return (
      <PageContainer width="narrow" className="min-h-page">
        <PageHeader back title="프로그램을 찾을 수 없어요" />
      </PageContainer>
    );
  }

  const total = BREAD_STORY.reduce((n, e) => n + e.minutes, 0);

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader
        back
        title="줄에서 보는 이야기"
        sub={`「${program.title}」 · 전체 약 ${total}분`}
      />
      {mine && (
        <p className="sticky top-16 z-10 mb-4 rounded-full bg-[#1f4e8c] px-4 py-2 text-center text-sm font-black text-white shadow">
          내 포인트 {shownPoints} P
        </p>
      )}

      {BREAD_STORY.map((ep) => (
        <article key={ep.no} className="mb-10">
          <header className="mb-3 flex items-end justify-between gap-3 border-b-2 border-[#1f4e8c] pb-2">
            <div>
              <p className="text-xs font-bold text-[#c2410c]">
                {ep.no}화 · {ep.place} · 약 {ep.minutes}분
              </p>
              <h2 className="text-xl font-black text-slate-900">{ep.title}</h2>
            </div>
            {canSpeak && (
              <button
                type="button"
                onClick={() => toggle(ep)}
                className="flex shrink-0 items-center gap-1 rounded-full bg-[#1f4e8c] px-3 py-1.5 text-sm font-bold text-white"
              >
                {reading === ep.no ? (
                  <Pause size={16} aria-hidden />
                ) : (
                  <Volume2 size={16} aria-hidden />
                )}
                {reading === ep.no ? '멈춤' : '듣기'}
              </button>
            )}
          </header>

          <div className="space-y-6">
            {ep.panels.map((p, i) => (
              <section key={i}>
                <div className="overflow-hidden rounded-lg border-2 border-slate-900">
                  <StoryScene scene={p.scene} label={p.lines[0] ?? ep.title} />
                </div>
                <div className="mt-3 space-y-1.5 px-1 text-[15px] leading-relaxed text-slate-800">
                  {p.lines.map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </div>
                {p.bubble && (
                  <p className="mx-1 mt-3 rounded-2xl rounded-tl-none border-2 border-slate-900 bg-white px-4 py-2.5 text-[15px] font-bold text-slate-900">
                    “{p.bubble}”
                  </p>
                )}
                <p className="mt-1 px-1 text-[11px] text-slate-400">출처 {p.src.join(', ')}</p>
              </section>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            {BREAD_QUIZ.filter((q) => q.episode === ep.no).map((q) => (
              <QuizCard
                key={q.id}
                quiz={q}
                applicationId={mine ? applicationId : undefined}
                alreadyAnswered={mine?.answered.includes(q.id) ?? false}
                onTotal={setPoints}
              />
            ))}
          </div>

          <p className="mt-6 rounded-xl bg-[#fbe7a1] px-4 py-3 text-sm font-bold text-[#1f4e8c]">
            {ep.next}
          </p>
        </article>
      ))}

      <section className="mt-8 border-t border-slate-200 pt-4">
        <h2 className="text-sm font-black text-slate-700">출처</h2>
        <ol className="mt-2 space-y-1 text-xs text-slate-500">
          {STORY_SOURCES.map((s) => (
            <li key={s.id}>
              {s.id}.{' '}
              <a href={s.url} target="_blank" rel="noreferrer" className="underline">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] text-slate-400">
          그림은 출처의 사실을 바탕으로 새로 그린 삽화입니다. 실제 인물·상호의 모습이 아닙니다.
        </p>
      </section>
    </PageContainer>
  );
}
