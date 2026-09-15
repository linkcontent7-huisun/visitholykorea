import { ChevronRight, MapPin } from 'lucide-react';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import { formatFromOrigin } from '../lib/plan-format';
import { useSettings } from '@/shared/i18n/use-settings';
import type { Candidate } from '../hooks/use-candidate-plans';
import type { CandidateTag } from '../lib/candidate-tags';

/**
 * 후보 카드 화면 — 결과의 첫 화면. 카드 최대 3장, 카드마다 근거 태그 1개.
 * 카드에는 이름 · 지역 · 거리 · 사진 · 태그만 — 3장을 한눈에 비교하는 화면이라 길어지면 안 된다.
 * 점심·오후는 카드를 눌러 들어가는 일정 화면(PlanResult)에.
 *
 * 스펙: docs/10-product/재기획/2026-09-15-오늘의-성지-일정-스펙.md 7-1 절.
 */

const TAG_LABEL: Record<CandidateTag, TranslationKey> = {
  nearest: 'tagNearest',
  quiet: 'tagQuiet',
  detailed: 'tagDetailed',
};

const TAG_STYLE: Record<CandidateTag, string> = {
  nearest: 'bg-brand-blue/10 text-brand-blue',
  quiet: 'bg-emerald-50 text-emerald-800',
  detailed: 'bg-amber-50 text-amber-800',
};

interface CandidateCardsProps {
  candidates: Candidate[];
  moodLabel: string;
  /** 반경 안에 아직 안 보여준 후보가 있으면 「더 보기」 */
  hasMore: boolean;
  /** 다음 시간 단계로 넓히면 늘어나는 수 — 카드가 3장 미만일 때 안내 */
  moreInNextRadius: number;
  onSelect: (index: number) => void;
  onMore: () => void;
  onWidenTime: () => void;
  onChangeMood: () => void;
}

export function CandidateCards({
  candidates,
  moodLabel,
  hasMore,
  moreInNextRadius,
  onSelect,
  onMore,
  onWidenTime,
  onChangeMood,
}: CandidateCardsProps) {
  const { t } = useSettings();

  return (
    <div>
      <h3 className="text-xl font-extrabold text-app-text mb-1 tracking-tight">
        {fillPlaceholders(t('planCandidatesTitle'), { mood: moodLabel, n: candidates.length })}
      </h3>
      <p className="text-xs text-app-text-muted mb-6">{t('planFirstSentenceHint')}</p>

      <ul className="space-y-3" id="plan-cards">
        {candidates.map((c, i) => (
          <li key={c.site.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="flex w-full items-center gap-4 rounded-[20px] border border-app-border bg-white p-3 text-left transition-transform active:scale-[0.99]"
              id={`plan-card-${c.site.id}`}
            >
              <span className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-app-bg">
                <SiteThumbnail
                  imageUrl={c.site.imageUrl}
                  name={c.site.name}
                  category={c.site.category}
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-extrabold text-app-text leading-tight">{c.site.name}</span>
                <span className="mt-1 flex items-center gap-1 text-xs font-bold text-app-text-muted">
                  <MapPin size={11} className="shrink-0" aria-hidden />
                  <span className="truncate">
                    {c.site.location ? `${c.site.location} · ` : ''}
                    {formatFromOrigin(c.distanceKm, t)}
                  </span>
                </span>
                <span className="mt-2 block">
                  {c.tag ? (
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-[0.6875rem] font-bold ${TAG_STYLE[c.tag]}`}
                    >
                      {t(TAG_LABEL[c.tag])}
                    </span>
                  ) : c.loading ? (
                    <span className="inline-block rounded-full bg-app-bg px-3 py-1 text-[0.6875rem] font-bold text-app-text-muted">
                      {t('tagChecking')}
                    </span>
                  ) : null}
                </span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-app-text-muted" aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {hasMore ? (
        <button
          type="button"
          onClick={onMore}
          className="mt-4 w-full rounded-[20px] border border-app-border bg-app-bg py-4 text-sm font-bold text-app-text"
          id="plan-more"
        >
          {t('planMore')}
        </button>
      ) : (
        <div className="mt-5 rounded-[20px] border border-dashed border-app-border p-5 text-center">
          <p className="text-sm font-bold text-app-text-muted">
            {moreInNextRadius > 0
              ? fillPlaceholders(t('planMoreInRadius'), { n: moreInNextRadius })
              : t('planExhausted')}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={onWidenTime}
              className="flex-1 rounded-[16px] bg-brand-blue py-3 text-sm font-bold text-white"
              id="plan-widen-time"
            >
              {t('planWidenTime')}
            </button>
            <button
              type="button"
              onClick={onChangeMood}
              className="flex-1 rounded-[16px] border border-app-border bg-white py-3 text-sm font-bold text-app-text"
              id="plan-change-mood"
            >
              {t('planChangeMood')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
