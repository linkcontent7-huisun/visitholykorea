import { ChevronRight, MapPin } from 'lucide-react';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import { formatFromOrigin } from '../lib/plan-format';
import { useSettings } from '@/shared/i18n/use-settings';
import { Button } from '@/shared/components/ui/Button';
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

// 강조색은 하나(brand-blue)라는 화면 규칙에 맞춰, 가장 가까운 후보만 강조색으로 두드러지게 하고
// 나머지 근거 태그는 두 번째 톤(brand-olive) 하나로 통일한다 — 태그마다 다른 색을 쓰면 색이 의미 없이 늘어난다.
const TAG_STYLE: Record<CandidateTag, string> = {
  nearest: 'bg-brand-blue/10 text-brand-blue',
  quiet: 'bg-brand-olive-soft text-brand-olive',
  detailed: 'bg-brand-olive-soft text-brand-olive',
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
      <h3 className="mb-1 font-display text-[1.375rem] leading-tight text-app-text lg:text-2xl">
        {fillPlaceholders(t('planCandidatesTitle'), { mood: moodLabel, n: candidates.length })}
      </h3>
      <p className="mb-6 text-sm text-app-text-muted">{t('planFirstSentenceHint')}</p>

      <ul className="space-y-3" id="plan-cards">
        {candidates.map((c, i) => (
          <li key={c.site.id}>
            <button
              type="button"
              onClick={() => onSelect(i)}
              className="flex w-full items-center gap-4 rounded-lg border border-app-border bg-white p-3 text-left transition-colors hover:border-brand-blue"
              id={`plan-card-${c.site.id}`}
            >
              <span className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-app-panel">
                <SiteThumbnail
                  imageUrl={c.site.imageUrl}
                  name={c.site.name}
                  category={c.site.category}
                  className="h-full w-full object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold leading-tight text-app-text">
                  {c.site.name}
                </span>
                <span className="mt-1 flex items-center gap-1 text-sm text-app-text-muted">
                  <MapPin size={14} className="shrink-0" aria-hidden />
                  <span className="truncate">
                    {c.site.location ? `${c.site.location} · ` : ''}
                    {formatFromOrigin(c.distanceKm, t)}
                  </span>
                </span>
                <span className="mt-2 block">
                  {c.tag ? (
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${TAG_STYLE[c.tag]}`}
                    >
                      {t(TAG_LABEL[c.tag])}
                    </span>
                  ) : c.loading ? (
                    <span className="inline-block rounded-full bg-app-panel px-3 py-1 text-xs font-bold text-app-text-muted">
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
        <Button variant="neutral" block onClick={onMore} className="mt-4" id="plan-more">
          {t('planMore')}
        </Button>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-app-border bg-white p-5 text-center">
          <p className="text-base font-bold text-app-text-muted">
            {moreInNextRadius > 0
              ? fillPlaceholders(t('planMoreInRadius'), { n: moreInNextRadius })
              : t('planExhausted')}
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={onWidenTime} className="flex-1" id="plan-widen-time">
              {t('planWidenTime')}
            </Button>
            <Button
              variant="neutral"
              onClick={onChangeMood}
              className="flex-1"
              id="plan-change-mood"
            >
              {t('planChangeMood')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
