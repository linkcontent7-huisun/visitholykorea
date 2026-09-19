import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { markTravelProfilePrompted, updateTravelProfile } from '@/features/auth/api/travel-profile';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 가입 후 딱 한 번 뜨는 여행 프로필 시트 — 국적 · 동행 · 여행사 여부.
 *
 * 왜 이 세 가지만 묻는가: 국가 통계(외래관광객조사)에 "성지순례"라는 방문목적
 * 자체가 없어서, 개별/단체 비율도 종교 목적자만 따로 뽑을 방법이 없었다.
 * 앱이 직접 안 물어보면 세상 어디에도 없는 데이터라는 뜻이다. 그래서 응답
 * 부담을 최소로 줄이려고 딱 세 문항만, 전부 건너뛸 수 있게 뒀다.
 */

/** 자주 오는 국가 위주 — 방한 상위국 + WYD 참가 규모가 큰 나라. 나머지는 '그 외'로 직접 고른다. */
const QUICK_COUNTRIES = [
  'KR',
  'US',
  'PH',
  'VN',
  'PL',
  'IT',
  'FR',
  'ES',
  'BR',
  'MX',
  'JP',
  'CN',
] as const;

/** ISO 3166-1 alpha-2 코드를 국기 이모지로. 지역 표시 문자(Regional Indicator)로 변환하는 표준 방식. */
function flagEmoji(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

interface TravelProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TravelProfileSheet({ isOpen, onClose }: TravelProfileSheetProps) {
  const { language, t } = useSettings();
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [companionMode, setCompanionMode] = useState<'alone' | 'with' | null>(null);
  const [companionCount, setCompanionCount] = useState<number>(1);
  const [isGuidedTour, setIsGuidedTour] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // 국가 이름은 앱 언어에 맞춰 브라우저가 알아서 번역해준다 — 190여 개국을
  // 6개 언어로 일일이 옮기는 대신, 이미 브라우저 안에 있는 지역명 사전을 쓴다.
  const countryNames = useMemo(
    () => new Intl.DisplayNames([language], { type: 'region' }),
    [language],
  );

  const finish = async (skip: boolean) => {
    setSaving(true);
    if (!skip) {
      await updateTravelProfile({
        countryCode,
        companionCount:
          companionMode === 'alone' ? 0 : companionMode === 'with' ? companionCount : null,
        isGuidedTour,
      });
    }
    await markTravelProfilePrompted();
    setSaving(false);
    onClose();
  };

  const optionButtonClass = (active: boolean) =>
    `min-h-12 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
      active
        ? 'border-brand-blue bg-brand-blue text-white'
        : 'border-app-border bg-white text-app-text hover:border-brand-blue/50'
    }`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('travelProfileTitle')}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-lg bg-white shadow-2xl sm:max-h-[85vh] sm:rounded-lg"
          >
            <header className="relative shrink-0 bg-brand-blue px-6 pb-7 pt-8 text-white">
              <button
                onClick={() => void finish(true)}
                disabled={saving}
                aria-label={t('travelProfileSkip')}
                className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 transition-colors hover:bg-white/30"
              >
                <X size={22} aria-hidden />
              </button>
              <h2 className="whitespace-pre-line font-display text-2xl leading-tight">
                {t('travelProfileTitle')}
              </h2>
              <p className="mt-2 text-base text-white/85">{t('travelProfileSub')}</p>
            </header>

            <div className="flex-1 space-y-8 overflow-y-auto overscroll-contain px-6 py-6">
              <section>
                <h3 className="mb-3 text-base font-bold text-app-text">
                  {t('travelProfileCountryLabel')}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_COUNTRIES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCountryCode(code)}
                      className={optionButtonClass(countryCode === code)}
                    >
                      <span className="mr-1">{flagEmoji(code)}</span>
                      {countryNames.of(code) ?? code}
                    </button>
                  ))}
                </div>
                <select
                  aria-label={t('travelProfileCountryOther')}
                  value={
                    countryCode &&
                    !QUICK_COUNTRIES.includes(countryCode as (typeof QUICK_COUNTRIES)[number])
                      ? countryCode
                      : ''
                  }
                  onChange={(e) => setCountryCode(e.target.value || null)}
                  className="mt-2 min-h-12 w-full rounded-lg border border-app-border bg-white px-4 text-base font-bold text-app-text"
                >
                  <option value="">{t('travelProfileCountryOther')}</option>
                  {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
                    .flatMap((a) =>
                      Array.from({ length: 26 }, (_, j) => String.fromCharCode(65 + j)).map(
                        (b) => `${a}${b}`,
                      ),
                    )
                    .filter(
                      (code) => !QUICK_COUNTRIES.includes(code as (typeof QUICK_COUNTRIES)[number]),
                    )
                    .map((code) => {
                      const name = countryNames.of(code);
                      // Intl.DisplayNames 는 실재하지 않는 코드도 그냥 코드 문자열을 돌려준다 —
                      // 실제 국가명(코드와 다른 문자열)만 걸러서 보여준다.
                      return name && name !== code ? { code, name } : null;
                    })
                    .filter((entry): entry is { code: string; name: string } => entry !== null)
                    .sort((a, b) => a.name.localeCompare(b.name, language))
                    .map(({ code, name }) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                </select>
              </section>

              <section>
                <h3 className="mb-3 text-base font-bold text-app-text">
                  {t('travelProfileCompanionLabel')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCompanionMode('alone')}
                    className={optionButtonClass(companionMode === 'alone')}
                  >
                    {t('travelProfileAlone')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompanionMode('with')}
                    className={optionButtonClass(companionMode === 'with')}
                  >
                    {t('travelProfileWithOthers')}
                  </button>
                </div>
                {companionMode === 'with' && (
                  <div className="mt-3">
                    <p className="mb-2 text-sm font-bold text-app-text-muted">
                      {t('travelProfileCompanionCountLabel')}
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCompanionCount(n)}
                          className={`h-11 w-11 rounded-full border text-sm font-bold transition-colors ${
                            companionCount === n
                              ? 'border-brand-blue bg-brand-blue text-white'
                              : 'border-app-border bg-white text-app-text'
                          }`}
                        >
                          {n === 4 ? '4+' : n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-base font-bold text-app-text">
                  {t('travelProfileTourLabel')}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGuidedTour(true)}
                    className={optionButtonClass(isGuidedTour === true)}
                  >
                    {t('travelProfileTourYes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGuidedTour(false)}
                    className={optionButtonClass(isGuidedTour === false)}
                  >
                    {t('travelProfileTourNo')}
                  </button>
                </div>
              </section>
            </div>

            <footer className="shrink-0 space-y-3 border-t border-app-border px-6 py-5">
              <button
                onClick={() => void finish(false)}
                disabled={saving}
                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-brand-blue text-base font-bold text-white transition-colors hover:bg-brand-blue/90 disabled:opacity-50"
              >
                {t('travelProfileDone')}
              </button>
              <button
                onClick={() => void finish(true)}
                disabled={saving}
                className="min-h-11 w-full text-center text-base font-bold text-app-text-muted"
              >
                {t('travelProfileSkip')}
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
