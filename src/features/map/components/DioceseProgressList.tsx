/**
 * 교구별 진행 막대.
 *
 * 많이 채운 교구가 위로 온다. 거의 다 온 교구는 색과 문구를 달리해서,
 * 스크롤을 내리지 않아도 "여기만 마저 가면 된다"가 먼저 보이게 한다.
 */

import type { DioceseProgress } from '../lib/progress';

interface Props {
  progress: DioceseProgress[];
  onSelectDiocese: (diocese: string) => void;
  selectedDiocese: string;
}

export function DioceseProgressList({ progress, onSelectDiocese, selectedDiocese }: Props) {
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
              className={`w-full rounded-2xl border p-3.5 text-left transition-all ${
                isSelected
                  ? 'border-brand-blue bg-white shadow-sm'
                  : 'border-app-border bg-white/70 hover:border-brand-violet'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-bold text-app-text">{p.diocese}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-app-text-muted">
                  {p.visited} / {p.total}
                </span>
              </div>

              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${p.diocese}교구 진행`}
              >
                <div
                  className={`h-full rounded-full transition-all ${
                    p.almost ? 'bg-brand-violet' : 'bg-brand-blue'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>

              {p.almost && (
                <p className="mt-2 text-xs font-semibold text-brand-violet">
                  {p.remainingSites.length === 1
                    ? `${p.remainingSites[0]?.name} 한 곳 남았습니다`
                    : `${p.remainingSites.length}곳 남았습니다`}
                </p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
