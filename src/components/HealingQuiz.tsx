import React, { useState } from 'react';
import { X, ChevronLeft, VolumeX, MessageCircle, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmotionTag, EMOTION_TAGS } from '../types';
import { getRecommendedCourses, CourseCard } from '../services/courseMatchingService';
import { useSettings } from '../contexts/SettingsContext';

interface HealingQuizProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSite: (id: string) => void;
}

const EMOTION_EMOJI: Record<EmotionTag, string> = {
  위로: '🕊️',
  새출발: '🌱',
  평온: '🍃',
  치유: '✨',
  감사: '🙏',
};

const EMOTION_LABEL: Record<EmotionTag, string> = {
  위로: '위로가 필요해요',
  새출발: '새로 시작하고 싶어요',
  평온: '그저 평온하고 싶어요',
  치유: '마음을 어루만지고 싶어요',
  감사: '감사한 마음을 나누고 싶어요',
};

const CONCERNS = ['일과 진로', '육아와 가족', '사람들과의 관계', '나 자신을 돌보는 일', '뚜렷한 이유는 없어요'] as const;
type Concern = (typeof CONCERNS)[number];

type Style = '침묵형' | '나눔형';

const TIME_BUDGETS = ['반나절', '하루', '1박2일'] as const;
type TimeBudget = (typeof TIME_BUDGETS)[number];

const CONCERN_OPENER: Record<Concern, string> = {
  '일과 진로': '일과 진로로 마음이 분주하셨죠.',
  '육아와 가족': '아이를 돌보느라 정작 나를 돌볼 틈이 없으셨겠어요.',
  '사람들과의 관계': '사람 사이에서 마음을 많이 쓰셨겠어요.',
  '나 자신을 돌보는 일': '나 자신을 돌보고 싶으셨군요.',
  '뚜렷한 이유는 없어요': '뚜렷한 이유가 없어도, 지친 마음은 그 자체로 소중해요.',
};

const STYLE_ACTIVITY: Record<Style, string> = {
  침묵형: '이곳에서는 혼자 조용히 걸으며 침묵의 시간을 가져보세요.',
  나눔형: '이곳에서는 수도자·사제와 편하게 이야기 나누는 차담 시간을 가져보세요.',
};

const TIME_NOTE: Record<TimeBudget, string> = {
  반나절: '짧은 시간이라도 충분해요.',
  하루: '하루를 온전히 이곳에 내어주세요.',
  '1박2일': '하룻밤 머물며 천천히 쉬어가세요.',
};

const TOTAL_QUESTIONS = 5;

export default function HealingQuiz({ isOpen, onClose, onSelectSite }: HealingQuizProps) {
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';
  const [step, setStep] = useState(0); // 0=intro, 1~5=질문, 6=결과
  const [emotion, setEmotion] = useState<EmotionTag | null>(null);
  const [concern, setConcern] = useState<Concern | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [timeBudget, setTimeBudget] = useState<TimeBudget | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<CourseCard | null>(null);
  const [resultLoading, setResultLoading] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setStep(0);
    setEmotion(null);
    setConcern(null);
    setStyle(null);
    setTimeBudget(null);
    setNote('');
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const goToResult = async () => {
    if (!emotion) return;
    setStep(6);
    setResultLoading(true);
    const courses = await getRecommendedCourses(emotion, undefined, 1);
    setResult(courses[0] ?? null);
    setResultLoading(false);
  };

  const progress = step >= 1 && step <= TOTAL_QUESTIONS ? step / TOTAL_QUESTIONS : step === 6 ? 1 : 0;

  return (
    <div className={`fixed inset-y-0 left-1/2 -translate-x-1/2 w-full ${widthClass} z-[310] bg-white flex flex-col`}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-app-border shrink-0">
        {step > 0 && step < 6 ? (
          <button onClick={() => setStep(step - 1)} className="p-2 text-app-text-muted" id="quiz-back">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <div className="w-9" />
        )}
        <span className="text-xs font-bold text-app-text-muted">마음 나침반</span>
        <button onClick={handleClose} className="p-2 text-app-text-muted" id="quiz-close">
          <X size={22} />
        </button>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div className="h-1 bg-app-bg shrink-0">
          <motion.div
            className="h-full bg-brand-blue"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8">
        <AnimatePresence mode="wait">
          {/* 인트로 */}
          {step === 0 && (
            <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-10 text-center">
              <div className="text-5xl mb-6">🧭</div>
              <h2 className="text-2xl font-extrabold text-app-text mb-4 tracking-tight">지금, 어떤 마음으로<br />여기 오셨나요?</h2>
              <p className="text-app-text-muted text-sm leading-relaxed mb-10">
                몇 가지만 여쭤볼게요.<br />당신에게 꼭 맞는 쉼의 자리를 찾아드릴게요.
              </p>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-brand-blue text-white py-4 rounded-[20px] font-bold text-sm shadow-lg shadow-brand-blue/20"
                id="quiz-start"
              >
                시작하기
              </button>
            </motion.div>
          )}

          {/* Q1: 감정 */}
          {step === 1 && (
            <motion.div key="q1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight">지금 마음에<br />가장 가까운 걸 골라주세요</h3>
              <div className="space-y-3">
                {EMOTION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setEmotion(tag);
                      setStep(2);
                    }}
                    className={`w-full flex items-center gap-4 p-5 rounded-[20px] border text-left transition-all ${
                      emotion === tag ? 'border-brand-blue bg-brand-blue/5' : 'border-app-border bg-white'
                    }`}
                    id={`quiz-emotion-${tag}`}
                  >
                    <span className="text-2xl">{EMOTION_EMOJI[tag]}</span>
                    <span className="font-bold text-app-text text-sm">{EMOTION_LABEL[tag]}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q2: 관심사 */}
          {step === 2 && (
            <motion.div key="q2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight">요즘 어떤 것에<br />마음을 많이 쓰고 계세요?</h3>
              <div className="space-y-3">
                {CONCERNS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setConcern(c);
                      setStep(3);
                    }}
                    className={`w-full p-5 rounded-[20px] border text-left font-bold text-sm transition-all ${
                      concern === c ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-app-border bg-white text-app-text'
                    }`}
                    id={`quiz-concern-${c}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q3: 참여 방식 */}
          {step === 3 && (
            <motion.div key="q3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight">오늘은 어떤 게<br />더 필요하세요?</h3>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { key: '침묵형' as Style, icon: VolumeX, label: '혼자 조용히 있고 싶어요' },
                    { key: '나눔형' as Style, icon: MessageCircle, label: '누군가와 이야기 나누고 싶어요' },
                  ]
                ).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setStyle(key);
                      setStep(4);
                    }}
                    className={`flex flex-col items-center gap-4 p-6 rounded-[24px] border transition-all ${
                      style === key ? 'border-brand-blue bg-brand-blue/5' : 'border-app-border bg-white'
                    }`}
                    id={`quiz-style-${key}`}
                  >
                    <Icon size={28} className="text-brand-blue" />
                    <span className="font-bold text-app-text text-xs leading-snug">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q4: 시간 */}
          {step === 4 && (
            <motion.div key="q4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight">오늘 얼마나<br />시간을 낼 수 있으세요?</h3>
              <div className="space-y-3">
                {TIME_BUDGETS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTimeBudget(t);
                      setStep(5);
                    }}
                    className={`w-full p-5 rounded-[20px] border text-left font-bold text-sm transition-all ${
                      timeBudget === t ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-app-border bg-white text-app-text'
                    }`}
                    id={`quiz-time-${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q5: 자유 텍스트 */}
          {step === 5 && (
            <motion.div key="q5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h3 className="text-xl font-extrabold text-app-text mb-4 tracking-tight">혹시 마음에 담아두고<br />싶은 말이 있다면 적어주세요</h3>
              <p className="text-xs text-app-text-muted mb-6">누구에게도 말 못했던 것도 괜찮아요. (선택)</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="여기에 적어주세요..."
                className="w-full bg-app-bg rounded-[20px] p-5 text-sm outline-none border border-app-border resize-none mb-6"
                id="quiz-note"
              />
              <div className="flex gap-3">
                <button
                  onClick={goToResult}
                  className="flex-1 py-2.5 text-app-text-muted font-bold text-xs"
                  id="quiz-skip"
                >
                  괜찮아요, 건너뛸게요
                </button>
                <button
                  onClick={goToResult}
                  className="flex-1 bg-brand-blue text-white py-4 rounded-[20px] font-bold text-sm shadow-lg shadow-brand-blue/20"
                  id="quiz-submit"
                >
                  다 됐어요
                </button>
              </div>
            </motion.div>
          )}

          {/* 결과 */}
          {step === 6 && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {resultLoading ? (
                <div className="pt-20 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-app-text-muted text-sm font-bold">당신을 위한 자리를 찾고 있어요...</p>
                </div>
              ) : result ? (
                <div>
                  <h3 className="text-xl font-extrabold text-app-text mb-6 tracking-tight text-center">
                    당신을 위한<br />쉼의 자리를 찾았어요
                  </h3>

                  <div className="rounded-[28px] overflow-hidden bg-white border border-app-border shadow-sm mb-6">
                    <div className="h-44 overflow-hidden bg-app-bg flex items-center justify-center">
                      {result.site.imageUrl ? (
                        <img src={result.site.imageUrl} alt={result.site.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-5xl opacity-30">⛪</span>
                      )}
                    </div>
                    <div className="p-6">
                      <h4 className="font-extrabold text-app-text text-lg mb-1">{result.site.name}</h4>
                      <p className="text-xs text-app-text-muted font-bold mb-4">{result.site.location}</p>
                      <div className="space-y-2 text-sm text-app-text-muted leading-relaxed">
                        {concern && <p>{CONCERN_OPENER[concern]}</p>}
                        {timeBudget && <p>{TIME_NOTE[timeBudget]}</p>}
                        {style && <p className="text-brand-blue font-bold">{STYLE_ACTIVITY[style]}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={reset}
                      className="flex-1 bg-app-bg text-app-text border border-app-border py-4 rounded-[20px] font-bold text-sm"
                      id="quiz-retry"
                    >
                      다시 골라볼게요
                    </button>
                    <button
                      onClick={() => {
                        onSelectSite(result.site.id);
                        handleClose();
                      }}
                      className="flex-1 bg-brand-blue text-white py-4 rounded-[20px] font-bold text-sm shadow-lg shadow-brand-blue/20"
                      id="quiz-go"
                    >
                      이 코스로 가볼게요
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <Footprints size={40} className="mx-auto mb-4 text-app-text-muted opacity-30" />
                  <p className="text-app-text-muted text-sm font-bold mb-6">
                    아직 이 마음에 꼭 맞는 코스를 준비 중이에요.
                  </p>
                  <button onClick={reset} className="text-brand-blue font-bold text-sm" id="quiz-retry-empty">
                    다시 골라볼게요
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
