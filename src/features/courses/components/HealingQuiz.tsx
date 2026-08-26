import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, VolumeX, MessageCircle, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EMOTION_TAGS, type EmotionTag } from '@/shared/types/domain';
import { useSettings } from '@/shared/i18n/use-settings';
import { getRecommendedCourses, type CourseCard } from '../api/course-matching';
import { useCompassMemory, useSaveCompassResponse } from '../hooks/use-compass-memory';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { REGIONS, regionCoords, type Region } from '@/shared/lib/regions';

type Gender = '여성' | '남성' | '응답 안 함';

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

// 색으로 직관적으로 고를 수 있도록 감정마다 고유한 색을 지정한다.
const EMOTION_COLOR: Record<EmotionTag, { bg: string; ring: string }> = {
  위로: { bg: 'bg-indigo-200', ring: 'ring-indigo-400' },
  새출발: { bg: 'bg-emerald-200', ring: 'ring-emerald-400' },
  평온: { bg: 'bg-cyan-200', ring: 'ring-cyan-400' },
  치유: { bg: 'bg-rose-200', ring: 'ring-rose-400' },
  감사: { bg: 'bg-amber-200', ring: 'ring-amber-400' },
};

const CONCERNS = [
  '일과 진로',
  '육아와 가족',
  '사람들과의 관계',
  '나 자신을 돌보는 일',
  '뚜렷한 이유는 없어요',
] as const;
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

// 1=감정 2=관심사 3=출발지역 4=성별 5=참여방식 6=시간 7=자유텍스트
const TOTAL_QUESTIONS = 7;
const RESULT_STEP = TOTAL_QUESTIONS + 1;

export function HealingQuiz({ isOpen, onClose, onSelectSite }: HealingQuizProps) {
  const { wideView, origin, setOrigin } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';
  const [step, setStep] = useState(0); // 0=intro, 1~7=질문, 8=결과
  const [emotion, setEmotion] = useState<EmotionTag | null>(null);
  const [concern, setConcern] = useState<Concern | null>(null);
  // 이미 출발지를 정해 둔 사람에게 같은 질문을 또 하지 않는다. 바꾸고 싶으면 이 자리에서 바꾼다.
  const [region, setRegion] = useState<Region | null>(origin);
  const [gender, setGender] = useState<Gender | null>(null);
  const [style, setStyle] = useState<Style | null>(null);
  const [timeBudget, setTimeBudget] = useState<TimeBudget | null>(null);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<CourseCard | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const saveResponse = useSaveCompassResponse();
  const { data: memory } = useCompassMemory();

  if (!isOpen) return null;

  const reset = () => {
    setStep(0);
    setEmotion(null);
    setConcern(null);
    setRegion(null);
    setGender(null);
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
    setStep(RESULT_STEP);
    setResultLoading(true);
    const originCoords = regionCoords(region) ?? undefined;
    const courses = await getRecommendedCourses(emotion, undefined, 1, originCoords);
    const top = courses[0] ?? null;
    setResult(top);
    setResultLoading(false);
    // 결과에 도달한 시점의 답을 남긴다. 비로그인·실패 시 조용히 넘어간다 (repository 참조).
    saveResponse.mutate({
      answers: {
        emotion,
        concern,
        gender,
        region,
        style,
        timeBudget,
        note: note.trim() || null,
      },
      matchedSiteId: top?.site.id ?? null,
      matchedSiteName: top?.site.name ?? null,
    });
  };

  const progress =
    step >= 1 && step <= TOTAL_QUESTIONS ? step / TOTAL_QUESTIONS : step === RESULT_STEP ? 1 : 0;

  const canProceed =
    step === 1
      ? emotion != null
      : step === 2
        ? concern != null
        : step === 3
          ? region != null
          : step === 4
            ? gender != null
            : step === 5
              ? style != null
              : step === 6
                ? timeBudget != null
                : true; // step 7(자유 텍스트)는 건너뛰어도 됨

  const handleNext = () => {
    if (step === TOTAL_QUESTIONS) {
      goToResult();
    } else if (canProceed) {
      setStep(step + 1);
    }
  };

  const isQuestionStep = step >= 1 && step <= TOTAL_QUESTIONS;

  return (
    <div
      className={`fixed inset-y-0 left-1/2 -translate-x-1/2 w-full ${widthClass} z-[310] bg-white flex flex-col`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-app-border shrink-0">
        <div className="w-9" />
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

      <div className={`flex-1 overflow-y-auto p-8 ${isQuestionStep ? 'pb-28' : ''}`}>
        <AnimatePresence mode="wait">
          {/* 인트로 */}
          {step === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pt-10 text-center"
            >
              <div className="text-5xl mb-6">🧭</div>
              <h2 className="text-2xl font-extrabold text-app-text mb-4 tracking-tight">
                지금, 어떤 마음으로
                <br />
                여기 오셨나요?
              </h2>
              <p className="text-app-text-muted text-sm leading-relaxed mb-10">
                몇 가지만 여쭤볼게요.
                <br />
                당신에게 꼭 맞는 쉼의 자리를 찾아드릴게요.
              </p>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-brand-blue text-white py-4 rounded-[20px] font-bold text-sm shadow-lg shadow-brand-blue/20"
                id="quiz-start"
              >
                시작하기
              </button>

              {/* 지난번 결과 — 응답 저장(로드맵 3단계)이 처음으로 화면에 돌아오는 자리 */}
              {memory?.matchedSiteId && memory.matchedSiteName && (
                <button
                  onClick={() => onSelectSite(memory.matchedSiteId!)}
                  className="mt-4 w-full rounded-[20px] border border-app-border bg-white px-5 py-3 text-left"
                >
                  <span className="block text-xs text-app-text-muted">
                    지난번엔 이곳을 권해드렸어요
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-brand-violet">
                    {memory.matchedSiteName} →
                  </span>
                </button>
              )}
            </motion.div>
          )}

          {/* Q1: 감정 — 색으로 직관적으로 고르기 */}
          {step === 1 && (
            <motion.div
              key="q1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-extrabold text-app-text mb-2 tracking-tight">
                지금 마음에
                <br />
                가장 가까운 색을 골라주세요
              </h3>
              <p className="text-xs text-app-text-muted mb-8">마음에 드는 색을 눌러주세요</p>
              <div className="grid grid-cols-3 gap-5">
                {EMOTION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setEmotion(tag)}
                    className="flex flex-col items-center gap-3"
                    id={`quiz-emotion-${tag}`}
                  >
                    <span
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-sm transition-all ${EMOTION_COLOR[tag].bg} ${
                        emotion === tag ? `ring-4 ${EMOTION_COLOR[tag].ring} scale-105` : ''
                      }`}
                    >
                      {EMOTION_EMOJI[tag]}
                    </span>
                    <span className="text-[11px] font-bold text-app-text-muted text-center leading-tight">
                      {EMOTION_LABEL[tag]}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q2: 관심사 */}
          {step === 2 && (
            <motion.div
              key="q2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight">
                요즘 어떤 것에
                <br />
                마음을 많이 쓰고 계세요?
              </h3>
              <div className="space-y-3">
                {CONCERNS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setConcern(c)}
                    className={`w-full p-5 rounded-[20px] border text-left font-bold text-sm transition-all ${
                      concern === c
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                        : 'border-app-border bg-white text-app-text'
                    }`}
                    id={`quiz-concern-${c}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q3: 출발 지역 — 시간 맞춘 일정을 짜려면 출발지가 있어야 거리를 잴 수 있다 */}
          {step === 3 && (
            <motion.div
              key="q3-region"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-extrabold text-app-text mb-2 tracking-tight">
                어디서
                <br />
                출발하세요?
              </h3>
              <p className="text-xs text-app-text-muted mb-8">가까운 곳부터 안내해드릴게요</p>
              <select
                value={region ?? ''}
                onChange={(e) => {
                  const next = (e.target.value || null) as Region | null;
                  setRegion(next);
                  // 여기서 고른 출발지를 앱 전체가 쓴다 — 홈·탐색도 이 기준으로 가까운 순이 된다
                  setOrigin(next);
                }}
                className="w-full bg-app-bg rounded-[20px] p-5 text-sm font-bold text-app-text outline-none border border-app-border appearance-none"
                id="quiz-region"
              >
                <option value="" disabled>
                  지역을 선택해주세요
                </option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Q4: 성별 — 성별 특정 프로그램(피정 등) 안내 시 활용 */}
          {step === 4 && (
            <motion.div
              key="q4-gender"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-extrabold text-app-text mb-2 tracking-tight">
                성별을
                <br />
                알려주시겠어요?
              </h3>
              <p className="text-xs text-app-text-muted mb-8">
                일부 프로그램은 성별에 따라 참여 대상이 달라요
              </p>
              <div className="space-y-3">
                {(['여성', '남성', '응답 안 함'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`w-full p-5 rounded-[20px] border text-left font-bold text-sm transition-all ${
                      gender === g
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                        : 'border-app-border bg-white text-app-text'
                    }`}
                    id={`quiz-gender-${g}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q5: 참여 방식 */}
          {step === 5 && (
            <motion.div
              key="q5-style"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight">
                오늘은 어떤 게<br />더 필요하세요?
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    key: '침묵형' as Style,
                    icon: VolumeX,
                    label: '혼자 조용히 있고 싶어요',
                    bg: 'bg-slate-200',
                    ring: 'ring-slate-400',
                    iconColor: 'text-slate-600',
                  },
                  {
                    key: '나눔형' as Style,
                    icon: MessageCircle,
                    label: '누군가와 이야기 나누고 싶어요',
                    bg: 'bg-orange-200',
                    ring: 'ring-orange-400',
                    iconColor: 'text-orange-600',
                  },
                ].map(({ key, icon: Icon, label, bg, ring, iconColor }) => (
                  <button
                    key={key}
                    onClick={() => setStyle(key)}
                    className="flex flex-col items-center gap-4"
                    id={`quiz-style-${key}`}
                  >
                    <span
                      className={`w-20 h-20 rounded-[28px] flex items-center justify-center shadow-sm transition-all ${bg} ${
                        style === key ? `ring-4 ${ring} scale-105` : ''
                      }`}
                    >
                      <Icon size={28} className={iconColor} />
                    </span>
                    <span className="font-bold text-app-text text-xs leading-snug text-center">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q6: 시간 */}
          {step === 6 && (
            <motion.div
              key="q6-time"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight">
                오늘 얼마나
                <br />
                시간을 낼 수 있으세요?
              </h3>
              <div className="space-y-3">
                {TIME_BUDGETS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeBudget(t)}
                    className={`w-full p-5 rounded-[20px] border text-left font-bold text-sm transition-all ${
                      timeBudget === t
                        ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                        : 'border-app-border bg-white text-app-text'
                    }`}
                    id={`quiz-time-${t}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q7: 자유 텍스트 */}
          {step === 7 && (
            <motion.div
              key="q7-note"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="text-xl font-extrabold text-app-text mb-4 tracking-tight">
                혹시 마음에 담아두고
                <br />
                싶은 말이 있다면 적어주세요
              </h3>
              <p className="text-xs text-app-text-muted mb-6">
                누구에게도 말 못했던 것도 괜찮아요. 건너뛰셔도 돼요.
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={5}
                placeholder="여기에 적어주세요... (선택)"
                className="w-full bg-app-bg rounded-[20px] p-5 text-sm outline-none border border-app-border resize-none"
                id="quiz-note"
              />
            </motion.div>
          )}

          {/* 결과 */}
          {step === RESULT_STEP && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {resultLoading ? (
                <div className="pt-20 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-app-text-muted text-sm font-bold">
                    당신을 위한 자리를 찾고 있어요...
                  </p>
                </div>
              ) : result ? (
                <div>
                  <h3 className="text-xl font-extrabold text-app-text mb-6 tracking-tight text-center">
                    당신을 위한
                    <br />
                    쉼의 자리를 찾았어요
                  </h3>

                  <div className="rounded-[28px] overflow-hidden bg-white border border-app-border shadow-sm mb-6">
                    <div className="h-44 overflow-hidden bg-app-bg flex items-center justify-center">
                      <SiteThumbnail
                        imageUrl={result.site.imageUrl}
                        name={result.site.name}
                        category={result.site.category}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6">
                      <h4 className="font-extrabold text-app-text text-lg mb-1">
                        {result.site.name}
                      </h4>
                      <p className="text-xs text-app-text-muted font-bold mb-4">
                        {result.site.location}
                      </p>
                      <div className="space-y-2 text-sm text-app-text-muted leading-relaxed">
                        {concern && <p>{CONCERN_OPENER[concern]}</p>}
                        {timeBudget && <p>{TIME_NOTE[timeBudget]}</p>}
                        {style && (
                          <p className="text-brand-blue font-bold">{STYLE_ACTIVITY[style]}</p>
                        )}
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
                  <button
                    onClick={reset}
                    className="text-brand-blue font-bold text-sm"
                    id="quiz-retry-empty"
                  >
                    다시 골라볼게요
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 화면 아래 고정된 이전/다음 버튼 — 스크롤해도 항상 보인다 */}
      {isQuestionStep && (
        <div
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full ${widthClass} p-6 pt-4 bg-white/95 backdrop-blur-md border-t border-app-border flex gap-3 z-[60]`}
        >
          <button
            onClick={() => setStep(step - 1)}
            className="w-16 h-14 bg-app-bg text-app-text border border-app-border rounded-[18px] flex items-center justify-center shrink-0"
            id="quiz-prev"
            aria-label="좀 전으로"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1 bg-brand-blue text-white rounded-[18px] font-bold text-sm shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:shadow-none"
            id="quiz-next"
          >
            {step === TOTAL_QUESTIONS ? '결과 보기' : '다음으로'}
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
