import { AnimatePresence, motion } from 'motion/react';
import { Download, Search, Share2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useModalFocus } from '@/shared/hooks/use-modal-focus';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { BAPTISM_NAMES } from '../data/baptism-names';
import { paths } from '@/app/routes/paths';
import { cardImageUrl, cardPngFile } from '../lib/card-image';
import { useBackClosesSheet } from '../lib/use-back-closes-sheet';
import {
  CHIP_LIMIT,
  featuredSaints,
  filterNames,
  LIST_PAGE,
  nameSlugOf,
  relatedNames,
  saintsOfName,
  sortedNames,
  type BaptismOption,
} from '../lib/baptism-groups';

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
  useBackClosesSheet(isOpen, onClose); // 뒤로 가기는 창만 닫는다(사이트를 벗어나지 않게)
  const bodyRef = useRef<HTMLDivElement>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const [query, setQuery] = useState('');
  /** 검색어가 없을 때 목록에 보이는 개수 — 휴대폰에서 230여 개를 한꺼번에 늘어놓지 않는다 */
  const [listCount, setListCount] = useState(LIST_PAGE);

  const featured = useMemo(() => featuredSaints(language), [language]);
  const names = useMemo(() => sortedNames(language), [language]);
  const shownNames = useMemo(() => filterNames(names, query, language), [names, query, language]);

  const selectedEntry = BAPTISM_NAMES.find((n) => n.slug === slug) ?? null;
  const selected: BaptismOption | null = selectedEntry
    ? { slug: selectedEntry.slug, kind: selectedEntry.kind, label: selectedEntry.names[language] }
    : null;
  /** 고른 카드가 속한 세례명의 한국 성인들 — 성인 카드를 골라도 같은 세례명의 다른 성인이 이어서 보인다 */
  const groupSaints = selectedEntry ? saintsOfName(nameSlugOf(selectedEntry), language) : [];
  /** 함께 묶인 세례명 — 같은 날 기념·가족·같은 이름 뿌리 (지시서 9호) */
  const related = selectedEntry ? relatedNames(selectedEntry.slug, language) : [];
  const listed = query.trim() ? shownNames : shownNames.slice(0, listCount);
  const [copied, setCopied] = useState(false);

  const pick = (next: string) => {
    setSlug(next);
    setFailed(false);
    setCopied(false);
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** 카드를 PNG 로 내려받는다 (인스타 등에 그림으로 올릴 때) */
  const save = async () => {
    if (!selected) return;
    setFailed(false);
    try {
      const file = await cardPngFile(language, selected.slug);
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setFailed(true);
    }
  };

  /**
   * 공유는 그림이 아니라 **카드 주소**를 보낸다 (사장님 지시 2026-11-11).
   * 그림 파일 안에는 누를 수 있는 버튼을 넣을 수 없다. 주소를 보내면 메신저가 카드 미리보기를 띄우고,
   * 받은 사람이 누르면 카드 화면(/card/…)이 열려 그 안의 버튼으로 우리 사이트에 들어온다.
   * 공유 창이 없는 브라우저(PC 등)는 주소를 복사한다.
   */
  const share = async () => {
    if (!selected) return;
    setFailed(false);
    const text = fillPlaceholders(t('baptismCardShareText'), { name: selected.label });
    const url = `${window.location.origin}${paths.baptismCard(language, selected.slug)}`;
    try {
      if (navigator.share) return await navigator.share({ text, url });
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
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
                      onClick={() => void save()}
                      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-blue px-3 font-bold text-white"
                      id="baptism-card-save"
                    >
                      <Download size={18} aria-hidden />
                      {t('baptismCardSave')}
                    </button>
                    <button
                      type="button"
                      onClick={() => void share()}
                      className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border-[1.5px] border-brand-blue px-3 font-bold text-brand-blue"
                      id="baptism-card-share"
                    >
                      <Share2 size={18} aria-hidden />
                      {t('baptismCardShare')}
                    </button>
                  </div>
                  {copied && (
                    <p role="status" className="text-center text-sm text-brand-blue">
                      {t('baptismCardLinkCopied')}
                    </p>
                  )}
                  {failed && (
                    <p role="alert" className="text-center text-sm text-red-700">
                      {t('baptismCardFailed')}
                    </p>
                  )}
                </section>
              )}

              {groupSaints.length > 0 && (
                <section>
                  <h4 className="mb-2 text-base font-bold text-app-text">
                    {t('baptismCardSaintsOfName')}
                  </h4>
                  <ChipList key={slug} options={groupSaints} selected={slug} onPick={pick} />
                </section>
              )}

              {related.length > 0 && (
                <section>
                  <h4 className="mb-2 text-base font-bold text-app-text">
                    {t('baptismCardRelated')}
                  </h4>
                  <ChipList key={slug} options={related} selected={slug} onPick={pick} />
                </section>
              )}

              {/* 세례명으로 많이 부르는 한국 성인 다섯 분 (사장님 결정 2026-11-15) */}
              <section>
                <h4 className="mb-2 text-base font-bold text-app-text">
                  {t('baptismCardPickSaint')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {featured.map((o) => (
                    <PickButton key={o.slug} option={o} active={o.slug === slug} onPick={pick} />
                  ))}
                </div>
              </section>

              {/* 세례명 전부 가나다순 — 다른 한국 성인은 각 세례명 카드 안에 모았다 */}
              <section>
                <h4 className="mb-2 text-base font-bold text-app-text">{t('baptismCardPick')}</h4>
                <label className="mb-3 flex min-h-11 items-center gap-2 rounded-lg border-[1.5px] border-app-border px-3 focus-within:border-brand-blue">
                  <Search size={18} aria-hidden className="shrink-0 text-app-text-muted" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('baptismCardSearch')}
                    aria-label={t('baptismCardSearch')}
                    className="min-w-0 flex-1 bg-transparent py-2 text-base outline-none"
                  />
                </label>
                {shownNames.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {listed.map((o) => (
                        <PickButton
                          key={o.slug}
                          option={o}
                          active={o.slug === slug}
                          onPick={pick}
                        />
                      ))}
                    </div>
                    {listed.length < shownNames.length && (
                      <MoreButton
                        label={`${t('planMore')} (${shownNames.length - listed.length})`}
                        onClick={() => setListCount((n) => n + LIST_PAGE)}
                      />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-app-text-muted">{t('baptismCardNoMatch')}</p>
                )}
              </section>

              <p className="text-xs leading-relaxed text-app-text-muted">{t('baptismCardNote')}</p>
              <p className="text-xs leading-relaxed text-app-text-muted">
                {t('baptismCardSources')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** 칩 몇 개만 보이고 나머지는 「더 보기」 — 베드로처럼 성인이 열네 분이어도 화면이 길어지지 않게 */
function ChipList({
  options,
  selected,
  onPick,
}: {
  options: BaptismOption[];
  selected: string | null;
  onPick: (slug: string) => void;
}) {
  const { t } = useSettings();
  const [all, setAll] = useState(false);
  const shown = all ? options : options.slice(0, CHIP_LIMIT);
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {shown.map((o) => (
          <PickButton key={o.slug} option={o} active={o.slug === selected} onPick={onPick} />
        ))}
      </div>
      {shown.length < options.length && (
        <MoreButton
          label={`${t('planMore')} (${options.length - shown.length})`}
          onClick={() => setAll(true)}
        />
      )}
    </>
  );
}

function MoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 min-h-11 w-full rounded-lg border-[1.5px] border-app-border px-3 text-base font-bold text-app-text"
    >
      {label}
    </button>
  );
}

function PickButton({
  option,
  active,
  onPick,
}: {
  option: BaptismOption;
  active: boolean;
  onPick: (slug: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(option.slug)}
      aria-pressed={active}
      className={`min-h-11 rounded-lg border-[1.5px] px-3 text-base font-bold ${
        active
          ? 'border-brand-blue bg-brand-blue text-white'
          : 'border-brand-blue bg-white text-brand-blue'
      }`}
    >
      {option.label}
    </button>
  );
}
