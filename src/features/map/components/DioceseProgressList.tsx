/**
 * 교구별 진행 막대.
 *
 * 많이 채운 교구가 위로 온다. 거의 다 온 교구는 색과 문구를 달리해서,
 * 스크롤을 내리지 않아도 "여기만 마저 가면 된다"가 먼저 보이게 한다.
 */

import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import type { DioceseProgress } from '../lib/progress';

interface Props {
  progress: DioceseProgress[];
  onSelectDiocese: (diocese: string) => void;
  selectedDiocese: string;
}

export function DioceseProgressList({ progress, onSelectDiocese, selectedDiocese }: Props) {
  const { t, language } = useSettings();
  return (
    <ul className="space-y-2.5">
      {progress.map((p) => {
        const percent = Math.round(p.ratio * 100);
        const isSelected = p.diocese === selectedDiocese;

        return (
          <li key={p.diocese}>
            <button
              type="button"
              onClick={() => onSelectDiocese(p.diocese)}
              aria-pressed={isSelected}
              className={`w-full rounded-lg border p-3.5 text-left transition-colors ${
                isSelected
                  ? 'border-brand-blue bg-white'
                  : 'border-app-border bg-white/70 hover:border-brand-blue/50'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-app-text">
                  {localizeRegionName(p.diocese, language)}
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-app-text-muted">
                  {p.visited} / {p.total}
                </span>
              </div>

              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-app-panel"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={fillPlaceholders(t('dioceseProgressAriaLabel'), {
                  diocese: localizeRegionName(p.diocese, language),
                })}
              >
                <div
                  // 「거의 다 찬」 교구만 올리브로 — 강조색(남색)과 구분되는 두 번째 톤을 쓴다.
                  // brand-violet 은 남색과 같은 값으로 고정돼(2026-09-16) 이 구분이 안 보이고 있었다.
                  className={`h-full rounded-full transition-all ${
                    p.almost ? 'bg-brand-olive' : 'bg-brand-blue'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {p.almost && (
                <p className="mt-2 text-xs font-semibold text-brand-olive">
                  {p.remainingSites.length === 1
                    ? fillPlaceholders(t('remainingSitesOne'), {
                        name: p.remainingSites[0]?.name ?? '',
                      })
                    : fillPlaceholders(t('remainingSitesCount'), {
                        count: p.remainingSites.length,
                      })}
                </p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
