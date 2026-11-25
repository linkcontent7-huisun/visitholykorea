import { X } from 'lucide-react';
import { dioceseInfo, dioceseText } from '../data/diocese-info';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 교구 설명 카드 — 지도에서 교구를 누르면 뜬다 (지시서 10호).
 * 아무것도 고르지 않았을 때는 한 줄 안내와 «교구란?» 만 보인다(처음 보는 사람을 위한 설명).
 * 성지 수는 운영 DB 에서 센 값(counts)을 받는다 — 글에 숫자를 박아 두면 성지가 늘 때 틀린다.
 */
export function DioceseInfoCard({
  diocese,
  counts,
  onClose,
}: {
  diocese: string | null;
  counts: Record<string, number>;
  onClose: () => void;
}) {
  const { t, language } = useSettings();
  const info = diocese ? dioceseInfo(diocese) : undefined;
  if (!info) {
    return (
      <div className="rounded-lg border border-app-border bg-white/95 p-4 text-sm leading-relaxed text-app-text shadow-sm">
        <p className="font-bold">{t('dioceseMapHint')}</p>
        <p className="mt-1 text-app-text-muted">{t('dioceseMapIntro')}</p>
        <p className="mt-2 border-t border-dashed border-app-border pt-2 text-xs text-app-text-muted">
          {t('dioceseWhat')}
        </p>
      </div>
    );
  }
  return (
    <section
      aria-live="polite"
      className="rounded-lg border-2 border-[#c9961a] bg-white p-4 text-sm leading-relaxed text-app-text shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-extrabold leading-tight">{dioceseText(info.name, language)}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('close')}
          className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-text-muted hover:bg-app-panel"
        >
          <X size={18} />
        </button>
      </div>
      <p className="mt-1">{dioceseText(info.about, language)}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt className="text-app-text-muted">{t('dioceseFounded')}</dt>
        <dd>{info.founded}</dd>
        <dt className="text-app-text-muted">{t('dioceseCathedral')}</dt>
        <dd>{dioceseText(info.cathedral, language)}</dd>
        <dt className="text-app-text-muted">{t('dioceseArea')}</dt>
        <dd>{dioceseText(info.area, language)}</dd>
        <dt className="text-app-text-muted">{t('dioceseSites')}</dt>
        <dd>{fillPlaceholders(t('dioceseSiteCount'), { n: counts[info.key] ?? 0 })}</dd>
      </dl>
      <p className="mt-2 border-t border-dashed border-app-border pt-2 text-xs text-app-text-muted">
        {t('dioceseWhat')}
      </p>
    </section>
  );
}
