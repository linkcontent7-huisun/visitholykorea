import { CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { useState } from 'react';
import { answerQuiz } from '../api/applications.repository';
import type { StoryQuiz } from '../data/bread-story';

/**
 * 돌발 퀴즈 한 문제 (2026-11-08). 각 화 끝 = 쉬는 지점에서만 보인다(걷는 중엔 띄우지 않는다 — 제안서 §4).
 * 나의 체험 링크로 들어온 사람(applicationId 있음)만 포인트가 쌓인다. 한 문제는 한 번만.
 */
export function QuizCard({
  quiz,
  applicationId,
  alreadyAnswered,
  onTotal,
}: {
  quiz: StoryQuiz;
  applicationId?: string;
  alreadyAnswered: boolean;
  onTotal: (total: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const done = picked !== null;
  const correct = picked === quiz.answer;

  async function pick(i: number) {
    if (done || saving) return;
    setPicked(i);
    if (!applicationId || alreadyAnswered) return;
    setSaving(true);
    try {
      onTotal(await answerQuiz(applicationId, quiz.id, i === quiz.answer));
    } catch {
      setError('포인트를 저장하지 못했어요. 잠시 뒤 다시 열어 주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[#c2410c] bg-white p-4">
      <p className="flex items-center gap-1 text-xs font-black text-[#c2410c]">
        <Sparkles size={14} aria-hidden />
        돌발 퀴즈 · 맞히면 10P
      </p>
      <p className="mt-1.5 text-base font-black text-slate-900">{quiz.q}</p>
      <div className="mt-3 grid gap-2">
        {quiz.choices.map((c, i) => {
          const isAnswer = done && i === quiz.answer;
          const isWrongPick = done && i === picked && !correct;
          return (
            <button
              key={c}
              type="button"
              disabled={done}
              onClick={() => pick(i)}
              className={`rounded-xl border-2 px-3 py-2.5 text-left text-sm font-bold ${
                isAnswer
                  ? 'border-[#1f4e8c] bg-[#eef4fc] text-[#1f4e8c]'
                  : isWrongPick
                    ? 'border-slate-300 bg-slate-100 text-slate-400 line-through'
                    : 'border-slate-200 bg-white text-slate-800'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
      {done && (
        <div className="mt-3 text-sm">
          <p
            className={`flex items-center gap-1 font-black ${correct ? 'text-[#1f4e8c]' : 'text-slate-600'}`}
          >
            {correct ? <CheckCircle2 size={16} aria-hidden /> : <XCircle size={16} aria-hidden />}
            {correct ? '정답!' : '아쉬워요.'} {quiz.explain}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {!applicationId
              ? '접수하신 분의 「나의 체험 링크」에서 풀면 포인트가 쌓여요.'
              : alreadyAnswered
                ? '이미 푼 문제라 포인트는 한 번만 쌓여요.'
                : saving
                  ? '포인트 저장 중…'
                  : correct
                    ? '10포인트가 쌓였어요.'
                    : '이번 문제는 포인트가 없어요.'}
          </p>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
