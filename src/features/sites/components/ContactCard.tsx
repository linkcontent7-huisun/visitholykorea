import { Globe, Phone, Printer } from 'lucide-react';
import type { HolySite } from '@/shared/types/domain';
import { useSettings } from '@/shared/i18n/use-settings';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';

/**
 * 성지 연락처.
 *
 * 순례자가 실제로 묻는 것은 "미사가 몇 시인가", "단체가 가도 되는가", "주차가 되는가"다.
 * 그 답은 우리 DB 가 아니라 **성지 사무실**에 있다. 설명을 아무리 길게 써도
 * 전화번호를 못 주면 그 질문에 답하지 못한다.
 *
 * 전화번호는 `tel:` 로 걸어 둔다 — 모바일에서 눌러서 바로 걸리는 것이 핵심이고,
 * 순례 인구에 고령층이 많아 번호를 옮겨 적게 하면 안 된다.
 *
 * 연락처가 하나도 없으면 **아무것도 그리지 않는다.** "정보 없음"이라는 빈 카드는
 * 화면만 차지하고 아무것도 알려주지 않는다.
 */
export function ContactCard({ site }: { site: HolySite }) {
  const { t } = useSettings();
  const { phone, homepageUrl, fax } = site;
  // 연락처가 하나도 없으면 "확인되지 않음"을 정직하게 적는다 — 임의로 채우지 않는다(재기획 §8).
  if (!phone && !homepageUrl && !fax) {
    return (
      <section aria-labelledby="contact-heading">
        <SectionHeading as="h3" size="md" id="contact-heading" title={t('visitInfoContact')} />
        <p className="rounded-lg border border-dashed border-app-border bg-white p-5 text-base leading-relaxed text-app-text-muted">
          {t('contactUnknown')}
        </p>
      </section>
    );
  }

  /** `tel:` 은 숫자와 +만 받는다. (02)740-9707 같은 표기를 그대로 넣으면 안 걸린다. */
  const telHref = phone ? `tel:${phone.replace(/[^0-9+]/g, '')}` : null;

  /** DB 에 스킴 없이 들어온 주소가 있어 보정한다 */
  const homeHref = homepageUrl
    ? /^https?:\/\//i.test(homepageUrl)
      ? homepageUrl
      : `https://${homepageUrl}`
    : null;

  return (
    <section aria-labelledby="contact-heading">
      <SectionHeading as="h3" size="md" id="contact-heading" title={t('visitInfoContact')} />

      <ul className="divide-y divide-app-border overflow-hidden rounded-lg border border-app-border bg-white">
        {telHref && (
          <li>
            <a
              href={telHref}
              className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-app-bg"
            >
              <Phone size={20} className="shrink-0 text-brand-blue" aria-hidden />
              <span className="flex-1 text-lg font-bold text-app-text" translate="no">
                {phone}
              </span>
              <span className="text-sm font-bold text-brand-blue">{t('contactCall')}</span>
            </a>
          </li>
        )}

        {homeHref && (
          <li>
            <a
              href={homeHref}
              target="_blank"
              rel="noreferrer noopener"
              className="flex min-h-14 items-center gap-3 px-5 py-3 transition-colors hover:bg-app-bg"
            >
              <Globe size={20} className="shrink-0 text-brand-blue" aria-hidden />
              <span
                className="min-w-0 flex-1 truncate text-base font-bold text-app-text"
                translate="no"
              >
                {homepageUrl}
              </span>
              <span className="shrink-0 text-sm font-bold text-brand-blue">
                {t('contactOpen')}
                <span className="sr-only"> {t('contactNewWindow')}</span>
              </span>
            </a>
          </li>
        )}

        {fax && (
          <li className="flex min-h-14 items-center gap-3 px-5 py-3">
            <Printer size={20} className="shrink-0 text-app-text-muted" aria-hidden />
            <span className="flex-1 text-base text-app-text-muted" translate="no">
              {fax}
            </span>
            <span className="text-sm text-app-text-muted">{t('contactFax')}</span>
          </li>
        )}
      </ul>
    </section>
  );
}
