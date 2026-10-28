import { AnimatePresence, motion } from 'motion/react';
import { Download, Share2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useModalFocus } from '@/shared/hooks/use-modal-focus';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { BAPTISM_NAMES } from '../data/baptism-names';
import { cardImageUrl, cardPngFile } from '../lib/card-image';

interface BaptismCardSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 「세례명으로 만나는 성지」 — 세례명을 고르면 카드(1080×1350)가 팝업으로 뜬다.
 *
 * 카드는 design/세례명-공유카드 에서 6개 언어로 미리 만들어 public/baptism-cards 에 둔 그림이다
 * (성인·성지 연결은 주교회의 103위 약전 표 기준 — 이 화면에서 지어내는 값은 없다).
 * 앱 언어를 따라 그 언어 카드가 나온다. 저장·공유는 PNG 로 바꿔 준다(인스타·카톡은 webp 를 못 받는 곳이 있다).
 */
export function BaptismCardSheet({ isOpen, onClose }: BaptismCardSheetProps) {
  const { language, t } = useSettings();
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const options = useMemo(
    () =>
      BAPTISM_NAMES.map((n) => ({ slug: n.slug, label: n.names[language] })).sort((a, b) =>
        a.label.localeCompare(b.label, language),
      ),
    [language],
  );
  const selected = options.find((o) => o.slug === slug) ?? null;
  const canShare = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

  const pick = (next: string) => {
    setSlug(next);
    setFailed(false);
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async (share: boolean) => {
    if (!selected) return;
    setFailed(false);
    try {
      const file = await cardPngFile(language, selected.slug);
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
        return;
      }
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (e) {
      // 공유 창을 사용자가 닫은 것(AbortError)은 실패가 아니다
      if (!(e instanceof DOMException && e.name === 'AbortError')) setFailed(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('baptismCardSheetAria')}
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
            className="relative flex h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-lg bg-white sm:h-[88dvh] sm:rounded-lg"
          >
            <header className="flex shrink-0 items-center justify-between bg-brand-blue px-5 py-3 text-white">
              <h3 className="text-lg font-extrabold leading-tight">{t('baptismCardEntryTitle')}</h3>
              <button
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline-white"
                aria-label={t('close')}
                data-autofocus
              >
                <X size={22} />
              </button>
            </header>

            <div ref={bodyRef} className="flex-1 space-y-5 overflow-y-auto p-5">
              {selected && (
                <section aria-live="polite" className="space-y-3">
                  <img
                    key={`${language}-${selected.slug}`}
                    src={cardImageUrl(language, selected.slug)}
                    alt={fillPlaceholders(t('baptismCardAlt'), { name: selected.label })}
                    width={1080}
                    height={1350}
                    className="mx-auto h-auto w-full max-w-[20rem] rounded-lg border border-app-border bg-app-panel"
                  />
                  <div className="mx-auto flex max-w-[20rem] gap-2">
                    <button
                      type="button"
                      onClick={() => void save(false)}
                      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-blue px-3 font-bold text-white"
                      id="baptism-card-save"
                    >
                      <Download size={18} aria-hidden />
                      {t('baptismCardSave')}
                    </button>
                    {canShare && (
                      <button
                        type="button"
                        onClick={() => void save(true)}
                        className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border-[1.5px] border-brand-blue px-3 font-bold text-brand-blue"
                        id="baptism-card-share"
                      >
                        <Share2 size={18} aria-hidden />
                        {t('baptismCardShare')}
                      </button>
                    )}
                  </div>
                  {failed && (
                    <p role="alert" className="text-center text-sm text-red-700">
                      {t('baptismCardFailed')}
                    </p>
                  )}
                </section>
              )}

              <section>
                <h4 className="mb-2 text-base font-bold text-app-text">{t('baptismCardPick')}</h4>
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => (
                    <button
                      key={o.slug}
                      type="button"
                      onClick={() => pick(o.slug)}
                      aria-pressed={o.slug === slug}
                      className={`min-h-11 rounded-lg border-[1.5px] px-3 text-base font-bold ${
                        o.slug === slug
                          ? 'border-brand-blue bg-brand-blue text-white'
                          : 'border-brand-blue bg-white text-brand-blue'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </section>

              <p className="text-xs leading-relaxed text-app-text-muted">{t('baptismCardNote')}</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
