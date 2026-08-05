import { useSettings } from '@/shared/i18n/use-settings';
import type { TranslationKey } from '@/shared/i18n/dictionary';

/**
 * 들어가기 전 안내.
 *
 * 비신자와 외국인이 성당 앞에서 실제로 멈추는 이유는 길을 몰라서가 아니라
 * **"들어가도 되는지, 실례가 아닌지"를 몰라서**다. 그 두려움을 없애는 것이
 * 이 서비스가 관광객을 성지로 데려오는 마지막 한 걸음이다.
 *
 * 문구는 금지 목록이 아니라 허락의 목록으로 쓴다. "하지 마세요"가 늘어날수록
 * 문턱이 높아진다. 정말 지켜야 할 것 하나(미사 중 촬영)만 마지막에 둔다.
 */
const ETIQUETTE_KEYS: TranslationKey[] = [
  'etiquetteBow',
  'etiquetteHolyWater',
  'etiquetteSeat',
  'etiquetteWelcome',
  'etiquettePhoto',
];

export function VisitEtiquette() {
  const { t } = useSettings();

  return (
    <section aria-labelledby="etiquette-heading">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
        <h2 id="etiquette-heading" className="text-xl font-extrabold tracking-tight text-app-text">
          {t('beforeYouGo')}
        </h2>
      </div>

      <ul className="space-y-2.5 rounded-[24px] border border-app-border bg-app-bg p-6">
        {ETIQUETTE_KEYS.map((key) => (
          <li key={key} className="flex gap-3 text-[14px] leading-relaxed text-app-text">
            <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-violet" />
            {t(key)}
          </li>
        ))}
      </ul>
    </section>
  );
}
