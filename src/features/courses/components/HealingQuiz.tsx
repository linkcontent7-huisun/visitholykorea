import { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Church, LocateFixed, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EMOTION_TAGS, type EmotionTag } from '@/shared/types/domain';
import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import {
  buildCandidatePool,
  CARD_PAGE_SIZE,
  RADIUS_KM_BY_TIME,
  TIME_BUDGETS,
  type Origin,
  type PooledSite,
  type TimeBudget,
} from '../api/course-matching';
import { useCompassMemory, useSaveCompassResponse } from '../hooks/use-compass-memory';
import { useCandidatePlans } from '../hooks/use-candidate-plans';
import { CandidateCards } from './CandidateCards';
import { PlanResult } from './PlanResult';
import { QuickDirectionsButtons } from '@/features/sites/components/QuickDirectionsButtons';
import { useNearbyDirectory } from '@/features/sites/hooks/use-nearby-directory';
import {
  directoryDisplayAddress,
  directoryDisplayName,
  formatDistanceKm,
} from '@/features/sites/lib/nearby-directory';
import { REGIONS, regionCoords, type Region } from '@/shared/lib/regions';

/**
 * 「오늘의 성지 일정」 — 질문 3개(마음 · 출발지 · 시간) → 후보 카드 최대 3장(태그 1개씩) → 카드를 누르면 하루 일정.
 *
 * 마음 질문은 후보 집합만 고르고, 순서는 거리가 정한다. 답을 다시 하지 않고 카드로
 * 돌아가 다른 곳을 고를 수 있다. 스펙: docs/10-product/재기획/2026-09-15-오늘의-성지-일정-스펙.md
 */

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

/** 표시 문구는 사전에서 온다. 여기 값은 사전 키다 — 내부 감정 코드(위로·치유…)는 그대로 쓴다. */
const EMOTION_LABEL: Record<EmotionTag, TranslationKey> = {
  위로: 'compassWishComfort',
  새출발: 'compassWishFreshStart',
  평온: 'compassWishCalm',
  치유: 'compassWishHealing',
  감사: 'compassWishGratitude',
};

// 색으로 직관적으로 고를 수 있도록 감정마다 고유한 색을 지정한다.
const EMOTION_COLOR: Record<EmotionTag, { bg: string; ring: string }> = {
  위로: { bg: 'bg-indigo-200', ring: 'ring-indigo-400' },
  새출발: { bg: 'bg-emerald-200', ring: 'ring-emerald-400' },
  평온: { bg: 'bg-cyan-200', ring: 'ring-cyan-400' },
  치유: { bg: 'bg-rose-200', ring: 'ring-rose-400' },
  감사: { bg: 'bg-amber-200', ring: 'ring-amber-400' },
};

const TIME_LABEL: Record<TimeBudget, TranslationKey> = {
  반나절: 'compassStayHalfDay',
  하루: 'compassStayDay',
  '1박2일': 'compassStayOvernight',
};

// 1=마음 2=출발지 3=시간 — 결과를 실제로 바꾸는 답만 남겼다. 성별·참여 방식(9/15), 자유 텍스트·관심사·인원(9/16)은
// 결과 성지나 일정을 바꾸지 않고 문장 한 줄만 바꿔서 뺐다. 50대 이용자에게 결과가 안 바뀌는 질문은 손가락 품이다.
const TOTAL_QUESTIONS = 3;
const RESULT_STEP = TOTAL_QUESTIONS + 1;
const STEP_ORIGIN = 2;
const STEP_TIME = 3;

const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 } };

export function HealingQuiz({ isOpen, onClose, onSelectSite }: HealingQuizProps) {
  const {
    wideView,
    origin: storedRegion,
    setOrigin: setStoredRegion,
    gpsLocation,
    gpsStatus,
    requestGpsLocation,
    t,
    language,
  } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  const [step, setStep] = useState(0); // 0=intro, 1~3=질문, 4=결과
  const [emotion, setEmotion] = useState<EmotionTag | null>(null);
  const [region, setRegion] = useState<Region | null>(storedRegion);
  // null = 아직 안 정함(GPS 가 되면 자동으로 GPS) · true = 현재 위치 · false = 시·도를 직접 골랐음
  const [useGps, setUseGps] = useState<boolean | null>(null);
  const [timeBudget, setTimeBudget] = useState<TimeBudget | null>(null);

  // 결과 — 반경 안 후보 전부(거리순)와 지금 보이는 페이지 · 고른 카드
  const [pool, setPool] = useState<PooledSite[]>([]);
  const [moreInNextRadius, setMoreInNextRadius] = useState(0);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [afternoonIndex, setAfternoonIndex] = useState<Record<string, number>>({});
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolError, setPoolError] = useState(false);
  // 카드에서 성지를 처음 고른 때 1회만 저장. 「처음부터 다시」 하면 다시 1회.
  const savedRef = useRef(false);

  const saveResponse = useSaveCompassResponse();
  const { data: memory } = useCompassMemory();

  const pageSites = pool.slice(page * CARD_PAGE_SIZE, page * CARD_PAGE_SIZE + CARD_PAGE_SIZE);
  const candidates = useCandidatePlans(step === RESULT_STEP ? pageSites : []);
  const chosen = selected == null ? null : (candidates[selected] ?? null);

  // 이 지역 본당·공소 — 감정 매칭 결과가 아니라 실제로 미사 참례가 가능한 가까운 본당 정보(2026-09-07 결정).
  const { data: nearbyParishes = [] } = useNearbyDirectory(chosen?.site.coordinates, 5, 3);

  // 출발지 질문에 들어오면 곧바로 위치 권한을 묻는다 — 시·도 중심점 + 반나절 20km 는 거의 「없어요」다(스펙 6절).
  useEffect(() => {
    if (step === STEP_ORIGIN && gpsStatus === 'idle') requestGpsLocation();
  }, [step, gpsStatus, requestGpsLocation]);
  // 위치가 허용됐고 사용자가 아직 시·도를 직접 고르지 않았으면 현재 위치가 기본.
  useEffect(() => {
    if (step === STEP_ORIGIN && gpsStatus === 'granted' && gpsLocation && useGps === null) setUseGps(true);
  }, [step, gpsStatus, gpsLocation, useGps]);

  if (!isOpen) return null;

  const regionCoord = region ? regionCoords(region) : null;
  const origin: Origin | null =
    useGps && gpsLocation
      ? { ...gpsLocation, label: t('currentLocationLabel'), kind: 'gps' }
      : region && regionCoord
        ? { ...regionCoord, label: localizeRegionName(region, language), kind: 'region' }
        : null;

  const reset = () => {
    setStep(0);
    setEmotion(null);
    setRegion(null);
    setUseGps(null);
    setTimeBudget(null);
    setPool([]);
    setMoreInNextRadius(0);
    setPage(0);
    setSelected(null);
    setAfternoonIndex({});
    setPoolError(false);
    savedRef.current = false;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const goToResult = async () => {
    if (!emotion || !origin || !timeBudget) return;
    setStep(RESULT_STEP);
    setPage(0);
    setSelected(null);
    setPoolLoading(true);
    setPoolError(false);
    try {
      const result = await buildCandidatePool(emotion, origin, timeBudget, language);
      setPool(result.pool);
      setMoreInNextRadius(result.moreInNextRadius);
    } catch (e) {
      console.error('후보 조회 실패:', e);
      setPoolError(true);
    } finally {
      setPoolLoading(false);
    }
  };

  /** 카드에서 성지를 처음 고른 때 1회 저장. 카드만 보고 나가면 저장하지 않는다. 비로그인은 조용히 건너뜀. */
  const selectCard = (index: number) => {
    setSelected(index);
    const site = pageSites[index]?.site;
    if (!site || !emotion || !origin) return;
    if (!savedRef.current) {
      savedRef.current = true;
      saveResponse.mutate({
        answers: {
          emotion,
          concern: null,
          origin: { kind: origin.kind, label: origin.label },
          region: origin.kind === 'region' ? region : null,
          gender: null,
          style: null,
          timeBudget,
          party: null,
          note: null,
        },
        matchedSiteId: site.id,
        matchedSiteName: site.name,
      });
    }
  };

  const goToQuestion = (q: number) => {
    setSelected(null);
    setPool([]);
    setStep(q);
  };

  const progress =
    step >= 1 && step <= TOTAL_QUESTIONS ? step / TOTAL_QUESTIONS : step === RESULT_STEP ? 1 : 0;

  const canProceed =
    step === 1 ? emotion != null : step === STEP_ORIGIN ? origin != null : timeBudget != null;

  const handleNext = () => {
    if (step === TOTAL_QUESTIONS) void goToResult();
    else setStep(step + 1);
  };

  const isQuestionStep = step >= 1 && step <= TOTAL_QUESTIONS;
  const optionClass = (active: boolean) =>
    `w-full p-5 rounded-[20px] border text-left font-bold text-sm transition-all ${
      active ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-app-border bg-white text-app-text'
    }`;

  return (
    // /compass 는 헤더·하단 탭이 있는 레이아웃 안에서 뜬다 (T-021). 스크롤은 ScrollShell 이 맡는다.
    <div className={`mx-auto flex w-full ${widthClass} min-h-page flex-col bg-white`}>
      <div className="h-16 flex items-center justify-between px-6 border-b border-app-border shrink-0">
        <div className="w-9" />
        <span className="text-xs font-bold text-app-text-muted">{t('compassTitle')}</span>
        <button onClick={handleClose} className="p-2 text-app-text-muted" id="quiz-close" aria-label={t('compassBack')}>
          <X size={22} />
        </button>
      </div>

      {progress > 0 && (
        <div className="h-1 bg-app-bg shrink-0">
          <motion.div
            className="h-full bg-brand-blue"
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <div className="flex-1 p-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="intro" {...fade} className="pt-10 text-center">
              <div className="text-5xl mb-6">🧭</div>
              <h2 className="text-2xl font-extrabold text-app-text mb-4 tracking-tight">
                {t('compassIntroLine1')}
                <br />
                {t('compassIntroLine2')}
              </h2>
              <p className="text-app-text-muted text-sm leading-relaxed mb-10">{t('compassIntroBody')}</p>
              <button
                onClick={() => setStep(1)}
                className="w-full bg-brand-blue text-white py-4 rounded-[20px] font-bold text-sm shadow-lg shadow-brand-blue/20"
                id="quiz-start"
              >
                {t('compassStart')}
              </button>
              {memory?.matchedSiteId && memory.matchedSiteName && (
                <button
                  onClick={() => onSelectSite(memory.matchedSiteId!)}
                  className="mt-4 w-full rounded-[20px] border border-app-border bg-white px-5 py-3 text-left"
                >
                  <span className="block text-xs text-app-text-muted">{t('compassLastRecommendation')}</span>
                  <span className="mt-0.5 block text-sm font-bold text-brand-violet">{memory.matchedSiteName} →</span>
                </button>
              )}
            </motion.div>
          )}

          {/* Q1: 마음 — 색으로 직관적으로 고르기. 후보 집합을 정한다 */}
          {step === 1 && (
            <motion.div key="q1" {...fade}>
              <h3 className="text-xl font-extrabold text-app-text mb-2 tracking-tight">
                {t('compassQ1TitleLine1')}
                <br />
                {t('compassQ1TitleLine2')}
              </h3>
              <p className="text-xs text-app-text-muted mb-8">{t('compassPickColor')}</p>
              <div className="flex flex-wrap justify-center gap-5">
                {EMOTION_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setEmotion(tag)}
                    className="flex w-[28%] flex-col items-center gap-3"
                    id={`quiz-emotion-${tag}`}
                  >
                    <span
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-sm transition-all ${EMOTION_COLOR[tag].bg} ${
                        emotion === tag ? `ring-4 ${EMOTION_COLOR[tag].ring} scale-105` : ''
                      }`}
                    >
                      {EMOTION_EMOJI[tag]}
                    </span>
                    <span className="text-[0.6875rem] font-bold text-app-text-muted text-center leading-tight">
                      {t(EMOTION_LABEL[tag])}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Q2: 출발지 — 현재 위치가 첫 선택지, 시·도는 GPS 를 못 쓸 때의 대안 */}
          {step === STEP_ORIGIN && (
            <motion.div key="q3-origin" {...fade}>
              <h3 className="text-xl font-extrabold text-app-text mb-2 tracking-tight">
                {t('compassQ3TitleLine1')}
                <br />
                {t('compassQ3TitleLine2')}
              </h3>
              <p className="text-xs text-app-text-muted mb-6">{t('compassNearbyNote')}</p>

              {gpsStatus === 'granted' && gpsLocation ? (
                <button type="button" onClick={() => setUseGps(true)} className={optionClass(useGps === true)} id="quiz-gps">
                  <span className="flex items-center gap-2">
                    <LocateFixed size={18} aria-hidden />
                    {t('fromCurrentLocation')}
                  </span>
                </button>
              ) : gpsStatus === 'loading' || gpsStatus === 'idle' ? (
                <button type="button" disabled className={optionClass(false)} id="quiz-gps">
                  <span className="flex items-center gap-2 opacity-60">
                    <LocateFixed size={18} aria-hidden />
                    {t('locatingNow')}
                  </span>
                </button>
              ) : (
                <p className="rounded-[20px] bg-app-bg p-4 text-xs font-bold text-app-text-muted" id="quiz-gps-unavailable">
                  {t('locationUnavailable')}
                </p>
              )}

              <p className="mt-6 mb-2 text-xs font-bold text-app-text-muted">{t('pickRegionInstead')}</p>
              <select
                value={useGps === true ? '' : (region ?? '')}
                onChange={(e) => {
                  const next = (e.target.value || null) as Region | null;
                  setRegion(next);
                  setUseGps(false);
                  // 여기서 고른 출발지를 앱 전체가 쓴다 — 홈·탐색도 이 기준으로 가까운 순이 된다
                  setStoredRegion(next);
                }}
                className="w-full bg-app-bg rounded-[20px] p-5 text-sm font-bold text-app-text outline-none border border-app-border appearance-none"
                id="quiz-region"
              >
                <option value="" disabled>
                  {t('regionSelectPlaceholder')}
                </option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {localizeRegionName(r, language)}
                  </option>
                ))}
              </select>
            </motion.div>
          )}

          {/* Q3: 시간 — 반경과 일정 줄 수를 정한다 */}
          {step === STEP_TIME && (
            <motion.div key="q4-time" {...fade}>
              <h3 className="text-xl font-extrabold text-app-text mb-8 tracking-tight">
                {t('compassQ6TitleLine1')}
                <br />
                {t('compassQ6TitleLine2')}
              </h3>
              <div className="space-y-3">
                {TIME_BUDGETS.map((tb) => (
                  <button key={tb} onClick={() => setTimeBudget(tb)} className={optionClass(timeBudget === tb)} id={`quiz-time-${tb}`}>
                    {t(TIME_LABEL[tb])}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 결과 — 후보 카드 → 일정 */}
          {step === RESULT_STEP && (
            <motion.div key="result" {...fade}>
              {poolLoading ? (
                <div className="pt-20 flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-app-text-muted text-sm font-bold">{t('compassFindingResult')}</p>
                </div>
              ) : poolError ? (
                <div className="text-center py-20">
                  <p className="text-app-text-muted text-sm font-bold mb-6">{t('planNearbyFailed')}</p>
                  <button onClick={() => void goToResult()} className="text-brand-blue font-bold text-sm" id="quiz-retry-pool">
                    {t('retry')}
                  </button>
                </div>
              ) : pool.length === 0 ? (
                <div className="py-10 text-center" id="plan-empty">
                  <h3 className="text-xl font-extrabold text-app-text mb-3 tracking-tight">{t('planEmptyTitle')}</h3>
                  <p className="text-sm text-app-text-muted mb-8">
                    {fillPlaceholders(t('planEmptyBody'), {
                      origin: origin?.label ?? '',
                      km: timeBudget ? RADIUS_KM_BY_TIME[timeBudget] : '',
                      mood: emotion ? t(EMOTION_LABEL[emotion]) : '',
                    })}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => goToQuestion(STEP_TIME)}
                      className="flex-1 bg-brand-blue text-white py-4 rounded-[20px] font-bold text-sm"
                      id="plan-widen-time"
                    >
                      {t('planWidenTime')}
                    </button>
                    <button
                      onClick={() => goToQuestion(1)}
                      className="flex-1 bg-app-bg text-app-text border border-app-border py-4 rounded-[20px] font-bold text-sm"
                      id="plan-change-mood"
                    >
                      {t('planChangeMood')}
                    </button>
                  </div>
                </div>
              ) : chosen ? (
                <div>
                  <PlanResult
                    candidate={chosen}
                    timeBudget={timeBudget ?? '하루'}
                    afternoonIndex={afternoonIndex[chosen.site.id] ?? 0}
                    onSwapAfternoon={() =>
                      setAfternoonIndex((m) => ({ ...m, [chosen.site.id]: (m[chosen.site.id] ?? 0) + 1 }))
                    }
                    onBack={() => setSelected(null)}
                    // 이동만 한다. 예전엔 여기서 닫기까지 불러 상세로 간 직후 나침반으로 되돌아왔다 (2026-09-12).
                    onGo={() => onSelectSite(chosen.site.id)}
                  />

                  {nearbyParishes.length > 0 && (
                    <div className="mt-6 rounded-[20px] border border-app-border bg-white p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <Church size={16} className="text-brand-violet" aria-hidden />
                        <h4 className="text-sm font-extrabold text-app-text">{t('regionParishesTitle')}</h4>
                      </div>
                      <p className="mb-1 text-[0.6875rem] leading-relaxed text-app-text-muted">{t('regionParishesBody')}</p>
                      {language !== 'ko' && nearbyParishes.some((p) => p.nameRomanized) && (
                        <p className="mb-4 text-[0.625rem] italic text-app-text-muted opacity-70">{t('directoryRomanizedNote')}</p>
                      )}
                      <ul className="mt-4 space-y-4">
                        {nearbyParishes.map((p) => {
                          const displayName = directoryDisplayName(p, language);
                          const displayAddress = directoryDisplayAddress(p, language);
                          return (
                            <li key={p.id}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="flex flex-wrap items-center gap-2">
                                    <span className="truncate text-sm font-bold text-app-text">{displayName}</span>
                                    <span className="shrink-0 rounded-full bg-app-bg px-2 py-0.5 text-[0.625rem] font-bold text-app-text-muted">
                                      {localizeDomainValue(p.category, t)}
                                    </span>
                                  </p>
                                  {displayAddress && (
                                    <p className="mt-0.5 truncate text-xs text-app-text-muted">{displayAddress}</p>
                                  )}
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-xs font-bold tabular-nums text-app-text-muted">
                                    {formatDistanceKm(p.distanceKm)}
                                  </span>
                                  {p.phone && (
                                    <a
                                      href={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
                                      aria-label={`${p.name} ${t('callPhone')}`}
                                      className="rounded-xl bg-app-bg p-2 text-brand-violet"
                                    >
                                      <Phone size={14} />
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2">
                                <QuickDirectionsButtons
                                  destination={{ name: displayName, lat: p.lat, lng: p.lng }}
                                  siteName={displayName}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <CandidateCards
                  candidates={candidates}
                  moodLabel={emotion ? t(EMOTION_LABEL[emotion]) : ''}
                  hasMore={(page + 1) * CARD_PAGE_SIZE < pool.length}
                  moreInNextRadius={moreInNextRadius}
                  onSelect={selectCard}
                  onMore={() => setPage((p) => p + 1)}
                  onWidenTime={() => goToQuestion(STEP_TIME)}
                  onChangeMood={() => goToQuestion(1)}
                />
              )}

              {!poolLoading && (
                <div className="mt-8 text-center">
                  <button onClick={reset} className="text-xs font-bold text-app-text-muted underline" id="quiz-retry">
                    {t('planStartOver')}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 화면 아래 붙는 이전/다음 버튼 — 스크롤해도 항상 보인다. 모바일에선 하단 탭(70px) 위. */}
      {isQuestionStep && (
        <div className="sticky bottom-[70px] z-30 flex w-full gap-3 border-t border-app-border bg-white/95 p-6 pt-4 backdrop-blur-md lg:bottom-0">
          <button
            onClick={() => setStep(step - 1)}
            className="w-16 h-14 bg-app-bg text-app-text border border-app-border rounded-[18px] flex items-center justify-center shrink-0"
            id="quiz-prev"
            aria-label={t('compassBack')}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1 bg-brand-blue text-white rounded-[18px] font-bold text-sm shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:shadow-none"
            id="quiz-next"
          >
            {step === TOTAL_QUESTIONS ? t('compassSeeResult') : t('compassNext')}
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
