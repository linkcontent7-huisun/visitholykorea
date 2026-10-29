import { AnimatePresence, motion } from 'motion/react';
import { Lightbulb, X } from 'lucide-react';
import { useState } from 'react';
import { useModalFocus } from '@/shared/hooks/use-modal-focus';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { HOLY_QUIZZES, pickText, type HolyQuiz } from '../data/holy-quiz';

interface DailyQuizPopupProps {
  isOpen: boolean;
  onClose: () => void;
  /** 처음 보여 줄 문항의 위치 — 오늘의 문제 */
  startIndex: number;
  quizzes?: HolyQuiz[];
}

/**
 * 「오늘의 성지순례 퀴즈」 — 홈을 열면 하루 한 번 오늘의 문제가 팝업으로 뜬다.
 * 보기를 고르면 바로 정답과 해설을 보여 준다(맞혀도 틀려도 — 틀렸을 때 배우는 게 더 많다).
 * 더 풀고 싶으면 「한 문제 더 풀기」로 오늘의 문제 다음부터 이어서 푼다(40문항을 한 바퀴 돌면 끝).
 * 문제 선택·하루 한 번 기록은 `lib/daily-quiz.ts` 가 맡는다.
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

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-lg bg-white sm:rounded-lg"
          >
            <header className="flex shrink-0 items-center justify-between bg-brand-blue px-5 py-3 text-white">
              <h3 className="text-lg font-extrabold leading-tight">{t('quizPopupTitle')}</h3>
              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-white"
                aria-label={t('close')}
                data-autofocus
              >
                <X size={22} />
              </button>
            </header>

            {/* 닫으면 이 안이 통째로 사라져 다음에 열 때 처음(오늘의 문제)부터 다시 시작한다 */}
            <QuizBody quizzes={quizzes} startIndex={startIndex} onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function QuizBody({
  quizzes,
  startIndex,
  onClose,
}: {
  quizzes: HolyQuiz[];
  startIndex: number;
  onClose: () => void;
}) {
  const { language, t } = useSettings();
  /** 이번에 열고 나서 몇 번째 문제인지(0부터) */
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hintOpen, setHintOpen] = useState(false);
  const [rightCount, setRightCount] = useState(0);

  const quiz = quizzes[(startIndex + step) % quizzes.length];
  if (!quiz) return null;

  const answered = picked !== null;
  const correct = picked === quiz.answer;
  const answerChoice = quiz.choices[quiz.answer];
  const solvedCount = step + (answered ? 1 : 0);
  const isLast = step + 1 >= quizzes.length;

  const choose = (i: number) => {
    setPicked(i);
    if (i === quiz.answer) setRightCount((n) => n + 1);
  };
  const next = () => {
    setStep((s) => s + 1);
    setPicked(null);
    setHintOpen(false);
  };

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-5">
      <p className="text-lg font-bold leading-snug text-app-text">
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
                className={`min-h-12 w-full rounded-lg border-[1.5px] px-4 py-2 text-left text-base font-bold disabled:cursor-default ${
                  isAnswer
                    ? 'border-green-700 bg-green-50 text-green-800'
                    : isWrongPick
                      ? 'border-red-700 bg-red-50 text-red-800'
                      : 'border-brand-blue bg-white text-brand-blue disabled:opacity-60'
                }`}
              >
                <span aria-hidden className="mr-2">
                  {i + 1}.
                </span>
                {pickText(choice, language)}
              </button>
            </li>
          );
        })}
      </ul>

      {!answered && (
        <div>
          {!hintOpen && (
            <button
              type="button"
              onClick={() => setHintOpen(true)}
              className="flex min-h-11 items-center gap-2 rounded-lg px-1 text-base font-bold text-brand-blue"
            >
              <Lightbulb size={18} aria-hidden />
              {t('quizHintShow')}
            </button>
          )}
          {hintOpen && (
            <p className="rounded-lg bg-app-panel p-3 text-base leading-relaxed text-app-text">
              💡 {pickText(quiz.hint, language)}
            </p>
          )}
        </div>
      )}

      {answered && (
        <section aria-live="polite" className="space-y-2">
          <p className={`text-lg font-extrabold ${correct ? 'text-green-800' : 'text-red-800'}`}>
            {correct
              ? t('quizCorrect')
              : fillPlaceholders(t('quizWrong'), {
                  answer: answerChoice ? pickText(answerChoice, language) : '',
                })}
          </p>
          <p className="rounded-lg bg-app-panel p-3 text-base leading-relaxed text-app-text">
            {pickText(quiz.explanation, language)}
          </p>
          <p className="text-sm font-bold text-app-text-muted">
            {fillPlaceholders(t('quizProgress'), { n: solvedCount, right: rightCount })}
          </p>
          {isLast ? (
            <p className="text-base font-bold text-app-text">
              {fillPlaceholders(t('quizAllDone'), { n: quizzes.length })}
            </p>
          ) : (
            <>
              <p className="text-sm text-app-text-muted">{t('quizNote')}</p>
              <button
                type="button"
                onClick={next}
                id="quiz-next"
                className="min-h-12 w-full rounded-lg bg-brand-blue px-4 text-base font-bold text-white"
              >
                {t('quizNext')}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 w-full rounded-lg border-[1.5px] border-brand-blue px-4 text-base font-bold text-brand-blue"
          >
            {t('close')}
          </button>
        </section>
      )}
    </div>
  );
}
