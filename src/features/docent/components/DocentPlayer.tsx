import { Gauge, Headphones, Pause, Play } from 'lucide-react';
import type { Language } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import type { DocentChapter } from '../lib/chapters';
import { useDocentPlayer } from '../hooks/use-docent-player';
import { isAndroid } from '../lib/headphones';

interface DocentPlayerProps {
  chapters: DocentChapter[];
  language: Language;
}

/**
 * 성지 상세의 챕터형 오디오 가이드.
 *
 * 각 챕터 줄 전체가 재생/정지 단추다(2026-09-17 사장님 지적) — 누르면 그 챕터가 재생되고,
 * 이미 재생 중인 줄을 다시 누르면 멈춘다. 번호 자리가 재생 중엔 정지 아이콘으로 바뀌어서
 * 잘못 눌렀어도 바로 알아차릴 수 있다. 진행 막대는 초 단위가 아니라 **문장 개수 기준**이다 —
 * 브라우저 TTS(`speechSynthesis`)는 재생 위치·길이를 안 준다(`useDocentPlayer` 참고).
 * 글은 챕터마다 전문을 그 줄 안에 바로 보여준다 — 소리를 못 듣는 곳에서도 읽을 수 있다.
 */
export function DocentPlayer({ chapters, language }: DocentPlayerProps) {
  const {
    currentIndex,
    isPlaying,
    playFrom,
    toggle,
    cycleRate,
    rateKey,
    isSupported,
    isVoiceMissing,
    hasError,
    headphoneGate,
    confirmHeadphones,
    isVerifying,
    sentenceIndex,
    totalSentences,
  } = useDocentPlayer(chapters, language);
  // 문구는 공용 사전에서 온다 — 6개 국어가 타입 검사로 강제된다
  const { t } = useSettings();
  const rateText = {
    slow: t('docentRateSlow'),
    normal: t('docentRateNormal'),
    fast: t('docentRateFast'),
  };
  const current = chapters[currentIndex];

  if (chapters.length === 0 || !current) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-app-border bg-app-bg">
      <div className="flex items-center gap-3 border-b border-app-border p-5">
        {isSupported && (
          <button
            onClick={toggle}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors ${
              isPlaying
                ? 'bg-brand-blue text-white'
                : 'border-[1.5px] border-brand-blue bg-white text-brand-blue hover:bg-brand-soft'
            }`}
            aria-label={isPlaying ? t('docentPause') : t('docentPlay')}
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <Pause size={22} aria-hidden />
            ) : (
              <Play size={22} className="ml-0.5" aria-hidden />
            )}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Headphones size={16} className="shrink-0 text-brand-blue" aria-hidden />
            <h3 className="whitespace-nowrap text-base font-bold text-app-text">
              {t('docentTitle')}
            </h3>
            <span className="text-sm font-bold tabular-nums text-app-text-muted">
              {currentIndex + 1}/{chapters.length}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-app-text-muted">{t('docentHint')}</p>
          {/* 「초안 — 현장 확인 전」 배지를 화면에서 뺐다(사장님 지적, 2026-09-17).
              ⚠️ 이 배지는 "문헌으로만 쓴 원고임을 정직하게 표시한다"는 더미 금지 원칙에서
              나왔다 — isDraft 값과 docentScript.status 는 그대로 두었으니, 다시 보여줘야
              한다면 이 자리에 되살리면 된다. */}
        </div>
        {/* 고령 사용자를 위한 속도 조절 — 느리게·보통·빠르게 순환 */}
        {isSupported && (
          <button
            onClick={cycleRate}
            className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-app-border bg-white px-3 text-sm font-bold text-app-text-muted transition-colors hover:border-brand-blue hover:text-brand-blue"
            aria-label={`${t('docentRateLabel')}: ${rateText[rateKey]}`}
          >
            <Gauge size={16} aria-hidden />
            {rateText[rateKey]}
          </button>
        )}
      </div>

      {/* 소리를 못 내는 환경을 조용히 지나치지 않는다 — 이유와 대안을 알려준다 */}
      {!isSupported && (
        <div className="border-b border-app-border bg-sky-50 px-5 py-3">
          <p className="text-sm leading-relaxed text-sky-900">{t('docentUnsupported')}</p>
        </div>
      )}
      {/* 성당 예절 가드 — 이어폰 없이 스피커로 틀면 미사와 기도에 방해가 된다 */}
      {headphoneGate && (
        <div className="border-b border-app-border bg-brand-soft px-5 py-4">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-app-text">
            <Headphones size={16} className="mt-0.5 shrink-0" aria-hidden />
            {headphoneGate === 'blocked' ? t('docentEarphoneBlocked') : t('docentEarphoneAsk')}
          </p>
          {/* 차단 안내 뒤에도 확인 버튼은 남긴다 — 마이크 없는 유선 이어폰은
              감지가 불가능해서, 출구가 없으면 정직한 사용자가 영구히 잠긴다 */}
          <>
            <button
              onClick={confirmHeadphones}
              disabled={isVerifying}
              className="mt-3 flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-blue text-base font-bold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
              id="docent-earphone-confirm"
            >
              {isVerifying ? t('docentEarphoneVerifying') : t('docentEarphoneConfirm')}
            </button>
            {/* 안드로이드는 버튼을 누르면 실제로 확인한다 — 권한 창이 왜 뜨는지 미리 알린다 */}
            {isAndroid() && (
              <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
                {t('docentEarphoneMicNote')}
              </p>
            )}
          </>
        </div>
      )}
      {/* 기기에 그 언어 음성이 아예 없으면 눌러도 소리가 안 난다 — 원인을 짚어준다 */}
      {isSupported && isVoiceMissing && (
        <div className="border-b border-app-border bg-amber-50 px-5 py-3">
          <p className="text-sm leading-relaxed text-amber-900">{t('docentVoiceMissing')}</p>
        </div>
      )}
      {hasError && !isVoiceMissing && (
        <div className="border-b border-app-border bg-amber-50 px-5 py-3">
          <p className="text-sm leading-relaxed text-amber-900">{t('docentError')}</p>
        </div>
      )}

      <ol>
        {chapters.map((chapter, i) => {
          const isCurrent = i === currentIndex;
          const isCurrentlyPlaying = isCurrent && isPlaying;
          const progressPct =
            isCurrentlyPlaying && totalSentences > 0
              ? Math.round((sentenceIndex / totalSentences) * 100)
              : 0;
          return (
            <li key={chapter.id} className="relative border-b border-app-border/60 last:border-b-0">
              {/* 재생 막대 — 문장 몇 개 중 몇 번째인지(초 단위를 안 주는 TTS 라서) */}
              {isCurrentlyPlaying && (
                <span
                  className="absolute inset-x-0 top-0 h-[3px] bg-app-border/40"
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t('docentTitle')}
                >
                  <span
                    className="block h-full bg-brand-blue transition-[width] duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </span>
              )}
              {/* 줄 전체가 재생/정지 단추 — 이미 재생 중인 줄을 다시 누르면 멈춘다.
                  번호가 재생 중엔 정지 아이콘으로 바뀌어 잘못 눌렀어도 바로 보인다. */}
              <button
                onClick={() => (isCurrentlyPlaying ? toggle() : playFrom(i))}
                aria-current={isCurrent}
                aria-pressed={isCurrentlyPlaying}
                className={`flex min-h-14 w-full items-start gap-3 px-5 py-3.5 text-left transition-colors ${
                  isCurrent ? 'bg-brand-soft' : 'hover:bg-white'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isCurrent ? 'bg-brand-blue text-white' : 'bg-app-border/60 text-app-text-muted'
                  }`}
                >
                  {isSupported && isCurrent ? (
                    isCurrentlyPlaying ? (
                      <Pause size={14} aria-hidden />
                    ) : (
                      <Play size={14} className="ml-0.5" aria-hidden />
                    )
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-base font-bold ${
                      isCurrent ? 'text-brand-blue' : 'text-app-text'
                    }`}
                  >
                    {chapter.title}
                  </span>
                  {/* 걸으면서 힐끗 보는 안내 — 어디로 가서 무엇을 볼지. 작은 라벨+값으로 묶어
                      아래 전문(스크립트)과 눈으로 바로 구분되게 한다(2026-09-17, 위계 지적 반영) */}
                  {(chapter.location || chapter.lookFor) && (
                    <span className="mt-1.5 flex flex-col gap-0.5">
                      {chapter.location && (
                        <span className="text-xs leading-relaxed text-app-text-muted">
                          <span className="font-bold text-brand-blue">{t('docentLocation')}</span>
                          {' · '}
                          {chapter.location}
                        </span>
                      )}
                      {chapter.lookFor && (
                        <span className="text-xs leading-relaxed text-app-text-muted">
                          <span className="font-bold text-brand-olive">{t('docentLookFor')}</span>
                          {' · '}
                          {chapter.lookFor}
                        </span>
                      )}
                    </span>
                  )}
                  {/* 전문(스크립트) — 소리를 켤 수 없는 곳, 잘 들리지 않는 이들을 위해 챕터마다 바로
                      보여준다. 위 두 안내보다 한 단계 크고 진하게 — 이게 실제로 읽는 본문이다. */}
                  <span className="mt-2 block text-base leading-relaxed text-app-text">
                    {chapter.narration}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
