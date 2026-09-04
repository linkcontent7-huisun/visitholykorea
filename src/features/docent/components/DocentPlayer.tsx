import { Gauge, Headphones, MapPin, Pause, Play } from 'lucide-react';
import type { Language } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import type { DocentChapter } from '../lib/chapters';
import { useDocentPlayer } from '../hooks/use-docent-player';
import { isAndroid } from '../lib/headphones';

interface DocentPlayerProps {
  chapters: DocentChapter[];
  isDraft: boolean;
  language: Language;
}

/** 성지 상세의 챕터형 오디오 가이드. 챕터를 누르면 거기부터 이어 읽는다. */
export function DocentPlayer({ chapters, isDraft, language }: DocentPlayerProps) {
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
  } = useDocentPlayer(chapters, language);
  // 문구는 공용 사전에서 온다 — 6개 국어가 타입 검사로 강제된다
  const { t } = useSettings();
  const rateText = { slow: t('docentRateSlow'), normal: t('docentRateNormal'), fast: t('docentRateFast') };
  const current = chapters[currentIndex];

  if (chapters.length === 0 || !current) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-[28px] border border-app-border bg-app-bg">
      <div className="flex items-center gap-3 border-b border-app-border p-5">
        {isSupported && (
          <button
            onClick={toggle}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all ${
              isPlaying
                ? 'bg-brand-violet text-white'
                : 'border border-app-border bg-white text-brand-violet'
            }`}
            aria-label={isPlaying ? t('docentPause') : t('docentPlay')}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Headphones size={14} className="shrink-0 text-brand-violet" />
            <h3 className="whitespace-nowrap text-sm font-extrabold text-app-text">
              {t('docentTitle')}
            </h3>
            <span className="text-[11px] font-bold text-app-text-muted">
              {currentIndex + 1}/{chapters.length}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] font-medium text-app-text-muted">
            {t('docentHint')}
          </p>
          {/* 문헌으로만 쓴 원고임을 정직하게 표시한다 — 더미 금지 원칙.
              좁은 화면에서 제목을 밀어내지 않도록 배지는 제목 아래 줄에 둔다 */}
          {isDraft && (
            <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700">
              {t('docentDraft')}
            </span>
          )}
        </div>
        {/* 고령 사용자를 위한 속도 조절 — 느리게·보통·빠르게 순환 */}
        {isSupported && (
          <button
            onClick={cycleRate}
            className="flex shrink-0 items-center gap-1 rounded-full border border-app-border bg-white px-2.5 py-1 text-[10px] font-extrabold text-app-text-muted"
            aria-label={`${t('docentRateLabel')}: ${rateText[rateKey]}`}
          >
            <Gauge size={12} />
            {rateText[rateKey]}
          </button>
        )}
      </div>

      {/* 소리를 못 내는 환경을 조용히 지나치지 않는다 — 이유와 대안을 알려준다 */}
      {!isSupported && (
        <div className="border-b border-app-border bg-sky-50 px-5 py-3">
          <p className="text-[11px] font-medium leading-relaxed text-sky-800">
            {t('docentUnsupported')}
          </p>
        </div>
      )}
      {/* 성당 예절 가드 — 이어폰 없이 스피커로 틀면 미사와 기도에 방해가 된다 */}
      {headphoneGate && (
        <div className="border-b border-app-border bg-violet-50 px-5 py-4">
          <p className="flex items-start gap-2 text-[12px] font-medium leading-relaxed text-violet-900">
            <Headphones size={14} className="mt-0.5 shrink-0" aria-hidden />
            {headphoneGate === 'blocked' ? t('docentEarphoneBlocked') : t('docentEarphoneAsk')}
          </p>
          {/* 차단 안내 뒤에도 확인 버튼은 남긴다 — 마이크 없는 유선 이어폰은
              감지가 불가능해서, 출구가 없으면 정직한 사용자가 영구히 잠긴다 */}
          <>
            <button
                onClick={confirmHeadphones}
                disabled={isVerifying}
                className="mt-3 w-full rounded-xl bg-brand-violet py-2.5 text-xs font-extrabold text-white disabled:opacity-50"
                id="docent-earphone-confirm"
              >
                {isVerifying ? t('docentEarphoneVerifying') : t('docentEarphoneConfirm')}
              </button>
              {/* 안드로이드는 버튼을 누르면 실제로 확인한다 — 권한 창이 왜 뜨는지 미리 알린다 */}
              {isAndroid() && (
                <p className="mt-2 text-[10px] font-medium leading-relaxed text-violet-700/70">
                  {t('docentEarphoneMicNote')}
                </p>
              )}
          </>
        </div>
      )}
      {/* 기기에 그 언어 음성이 아예 없으면 눌러도 소리가 안 난다 — 원인을 짚어준다 */}
      {isSupported && isVoiceMissing && (
        <div className="border-b border-app-border bg-amber-50 px-5 py-3">
          <p className="text-[11px] font-medium leading-relaxed text-amber-800">
            {t('docentVoiceMissing')}
          </p>
        </div>
      )}
      {hasError && !isVoiceMissing && (
        <div className="border-b border-app-border bg-amber-50 px-5 py-3">
          <p className="text-[11px] font-medium leading-relaxed text-amber-800">{t('docentError')}</p>
        </div>
      )}

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
                      {t('docentLocation')}: {chapter.location}
                    </span>
                  )}
                  {chapter.lookFor && (
                    <span className="mt-0.5 block text-[11px] font-medium leading-relaxed text-app-text-muted">
                      👁 {t('docentLookFor')}: {chapter.lookFor}
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
