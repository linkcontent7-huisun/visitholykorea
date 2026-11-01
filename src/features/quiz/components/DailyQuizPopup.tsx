import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb, X } from 'lucide-react';
import { useState } from 'react';
import { useModalFocus } from '@/shared/hooks/use-modal-focus';
import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { HOLY_QUIZZES, pickText, type HolyQuiz } from '../data/holy-quiz';
import { QUIZ_SET_SIZE } from '../lib/daily-quiz';

interface DailyQuizPopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** 오늘 한 판의 첫 문항 위치 */
  startIndex: number;
  quizzes?: HolyQuiz[];
}

/**
 * 「오늘의 성지순례 퀴즈」 — 표지 → 3문제 → 결과 카드 (2026-11-01 개편).
 *
 * 사장님 지적: 문제부터 불쑥 나오고 한 문제로 끝나 「왜 눌러야 하는지」도 「끝난 맛」도 없었다.
 * cpbc 「모두의 세례명」처럼 **표지 한 장**으로 무엇을 하는지 먼저 알려 주고,
 * 결과는 순례 단계(칭호)로 돌려줘 공유할 거리가 생기게 했다.
 * 그림·색은 세례명 카드(`design/세례명-공유카드/`)와 같은 크림 카드·남색 테두리·비둘기로 맞춘다.
 */
export function DailyQuizPopup({
  isOpen,
  onClose,
  startIndex,
  quizzes = HOLY_QUIZZES,
}: DailyQuizPopupProps) {
  const { t } = useSettings();
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('quizPopupTitle')}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 남색 테두리 안의 크림 카드 — 세례명 카드와 같은 틀 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex max-h-[94dvh] w-full max-w-md flex-col rounded-t-2xl bg-[#1f2f55] p-3 sm:rounded-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-[#1f2f55]/70 transition-colors hover:bg-[#1f2f55]/10"
              aria-label={t('close')}
            >
              <X size={22} />
            </button>
            <div className="flex-1 overflow-y-auto rounded-xl border border-[#d9d6cc] bg-[#f4f3ef]">
              {/* 닫으면 이 안이 통째로 사라져 다음에 열 때 표지부터 다시 시작한다 */}
              <QuizBody quizzes={quizzes} startIndex={startIndex} onClose={onClose} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

type Phase = 'cover' | 'play' | 'result';

function QuizBody({
  quizzes,
  startIndex,
  onClose,
}: {
  quizzes: HolyQuiz[];
  startIndex: number;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>('cover');
  /** 지금 판의 첫 문항 — 「3개 더 풀기」를 누르면 3칸 뒤로 */
  const [setStart, setSetStart] = useState(startIndex);
  const [right, setRight] = useState(0);

  if (phase === 'cover') {
    return <Cover onStart={() => setPhase('play')} onClose={onClose} />;
  }
  if (phase === 'play') {
    const set = Array.from(
      { length: Math.min(QUIZ_SET_SIZE, quizzes.length) },
      (_, k) => quizzes[(setStart + k) % quizzes.length],
    ).filter((q): q is HolyQuiz => Boolean(q));
    return (
      <Play
        key={setStart}
        set={set}
        onDone={(n) => {
          setRight(n);
          setPhase('result');
        }}
      />
    );
  }
  return (
    <Result
      right={right}
      total={QUIZ_SET_SIZE}
      onMore={() => {
        setSetStart((s) => (s + QUIZ_SET_SIZE) % quizzes.length);
        setPhase('play');
      }}
      onClose={onClose}
    />
  );
}

/** 비둘기 + 제목 + 주황 밑줄 — 표지와 결과에 같이 쓰는 카드 머리 */
function CardHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center">
      <img src="/brand/dove.png" alt="" aria-hidden className="mx-auto h-16 w-auto" />
      <p className="mt-4 font-display text-base text-[#5b6b4e]">{kicker}</p>
      <h3 className="mt-2 whitespace-pre-line font-display text-[1.875rem] leading-tight text-[#1f2f55]">
        {title}
      </h3>
      <div className="mx-auto mt-4 h-[3px] w-14 rounded-full bg-[#c0703a]" aria-hidden />
    </div>
  );
}

function Cover({ onStart, onClose }: { onStart: () => void; onClose: () => void }) {
  const { t } = useSettings();
  return (
    <div className="px-6 pb-6 pt-10">
      <CardHead kicker={t('quizCoverKicker')} title={t('quizPopupTitle')} />
      <p className="mt-5 whitespace-pre-line text-center text-base leading-relaxed text-app-text">
        {t('quizCoverLead')}
      </p>
      {/* 결과로 받을 순례 단계 미리 보기 — 「무엇을 얻는지」가 보여야 누른다 */}
      <ul className="mt-6 grid grid-cols-2 gap-2 text-center text-sm font-bold text-[#1f2f55]">
        {(['quizRank0', 'quizRank1', 'quizRank2', 'quizRank3'] as const).map((key, i) => (
          <li key={key} className="rounded-lg bg-[#e6eaf3] px-2 py-2.5">
            <span className="block text-[#c0703a]" aria-hidden>
              {'★'.repeat(i) || '☆'}
            </span>
            {t(key)}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onStart}
        id="quiz-start"
        data-autofocus
        className="mt-7 min-h-14 w-full rounded-xl bg-[#1f2f55] px-4 text-lg font-bold text-white shadow-md transition-transform active:scale-[0.98]"
      >
        {t('quizStart')}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 min-h-11 w-full rounded-lg text-base font-bold text-app-text-muted"
      >
        {t('quizLater')}
      </button>
    </div>
  );
}

function Play({ set, onDone }: { set: HolyQuiz[]; onDone: (right: number) => void }) {
  const { language, t } = useSettings();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [right, setRight] = useState(0);

  const quiz = set[step];
  if (!quiz) return null;
  const answered = picked !== null;
  const correct = picked === quiz.answer;
  const answerChoice = quiz.choices[quiz.answer];
  const isLast = step + 1 >= set.length;

  const choose = (i: number) => {
    setPicked(i);
    if (i === quiz.answer) setRight((n) => n + 1);
  };
  const next = () => {
    if (isLast) return onDone(right);
    setStep((s) => s + 1);
    setPicked(null);
    setHintOpen(false);
  };

  return (
    <div className="space-y-4 px-5 pb-6 pt-6">
      {/* 진행 점 — 몇 개 남았는지 보여야 끝까지 푼다 */}
      <div className="flex items-center gap-3 pr-12">
        <p className="text-sm font-bold text-[#5b6b4e]">
          {fillPlaceholders(t('quizStepOf'), { n: step + 1, total: set.length })}
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {set.map((q, i) => (
            <span
              key={q.id}
              className={`h-2 w-8 rounded-full ${i <= step ? 'bg-[#c0703a]' : 'bg-[#d9d6cc]'}`}
            />
          ))}
        </div>
      </div>

      <p className="font-display text-xl leading-snug text-[#1f2f55]">
        {pickText(quiz.question, language)}
      </p>

      <ul className="space-y-2">
        {quiz.choices.map((choice, i) => {
          const isAnswer = answered && i === quiz.answer;
          const isWrongPick = answered && i === picked && !correct;
          return (
            <li key={`${quiz.id}-${i}`}>
              <button
                type="button"
                disabled={answered}
                onClick={() => choose(i)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-[1.5px] px-3 py-2 text-left text-base font-bold shadow-sm transition-colors disabled:cursor-default ${
                  isAnswer
                    ? 'border-green-700 bg-green-50 text-green-800'
                    : isWrongPick
                      ? 'border-red-700 bg-red-50 text-red-800'
                      : 'border-[#d9d6cc] bg-white text-[#1f2f55] hover:border-[#1f2f55] disabled:opacity-60'
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                    isAnswer
                      ? 'bg-green-700 text-white'
                      : isWrongPick
                        ? 'bg-red-700 text-white'
                        : 'bg-[#e6eaf3] text-[#1f2f55]'
                  }`}
                >
                  {isAnswer ? '✓' : isWrongPick ? '✕' : i + 1}
                </span>
                {pickText(choice, language)}
              </button>
            </li>
          );
        })}
      </ul>

      {!answered &&
        (hintOpen ? (
          <p className="rounded-lg bg-white p-3 text-base leading-relaxed text-app-text">
            💡 {pickText(quiz.hint, language)}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setHintOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-lg px-1 text-base font-bold text-[#1f2f55]"
          >
            <Lightbulb size={18} aria-hidden />
            {t('quizHintShow')}
          </button>
        ))}

      {answered && (
        <section aria-live="polite" className="space-y-3">
          <p className={`text-lg font-extrabold ${correct ? 'text-green-800' : 'text-red-800'}`}>
            {correct
              ? t('quizCorrect')
              : fillPlaceholders(t('quizWrong'), {
                  answer: answerChoice ? pickText(answerChoice, language) : '',
                })}
          </p>
          <p className="rounded-lg bg-white p-3 text-base leading-relaxed text-app-text">
            {pickText(quiz.explanation, language)}
          </p>
          <button
            type="button"
            onClick={next}
            id="quiz-next"
            className="min-h-14 w-full rounded-xl bg-[#1f2f55] px-4 text-lg font-bold text-white"
          >
            {isLast ? t('quizSeeResult') : t('quizNextQuestion')}
          </button>
        </section>
      )}
    </div>
  );
}

const RANK_KEYS: TranslationKey[] = ['quizRank0', 'quizRank1', 'quizRank2', 'quizRank3'];

function Result({
  right,
  total,
  onMore,
  onClose,
}: {
  right: number;
  total: number;
  onMore: () => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const [copied, setCopied] = useState(false);
  const rank = t(RANK_KEYS[Math.min(right, RANK_KEYS.length - 1)] ?? 'quizRank0');

  /** 휴대폰은 기본 공유 창(카톡 포함), 안 되는 브라우저는 링크 복사로 */
  const share = async () => {
    const text = fillPlaceholders(t('quizShareText'), { rank });
    const url = window.location.origin;
    try {
      if (navigator.share) return await navigator.share({ text, url });
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
    } catch {
      // 공유 창을 닫은 경우 — 아무것도 하지 않는다
    }
  };

  return (
    <div className="px-6 pb-6 pt-10">
      <CardHead kicker={fillPlaceholders(t('quizResultScore'), { right, total })} title={rank} />
      <p className="mt-3 text-center text-2xl tracking-widest text-[#c0703a]" aria-hidden>
        {'★'.repeat(right)}
        <span className="text-[#d9d6cc]">{'★'.repeat(Math.max(0, total - right))}</span>
      </p>
      <p className="mt-4 text-center text-base text-app-text">{t('quizResultNote')}</p>
      <button
        type="button"
        onClick={onMore}
        className="mt-6 min-h-14 w-full rounded-xl bg-[#1f2f55] px-4 text-lg font-bold text-white"
      >
        {t('quizMore')}
      </button>
      <button
        type="button"
        onClick={() => void share()}
        className="mt-2 min-h-12 w-full rounded-xl border-[1.5px] border-[#1f2f55] bg-white px-4 text-base font-bold text-[#1f2f55]"
      >
        {t('quizShare')}
      </button>
      {copied && (
        <p className="mt-2 text-center text-sm font-bold text-[#1f2f55]" role="status">
          {t('quizCopied')}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="mt-2 min-h-11 w-full rounded-lg text-base font-bold text-app-text-muted"
      >
        {t('close')}
      </button>
    </div>
  );
}
