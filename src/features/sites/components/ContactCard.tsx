import { Globe, Phone, Printer } from 'lucide-react';
import type { HolySite } from '@/shared/types/domain';

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
  const { phone, homepageUrl, fax } = site;
  if (!phone && !homepageUrl && !fax) return null;

  /** `tel:` 은 숫자와 +만 받는다. (02)740-9707 같은 표기를 그대로 넣으면 안 걸린다. */
  const telHref = phone ? `tel:${phone.replace(/[^0-9+]/g, '')}` : null;

  /** DB 에 스킴 없이 들어온 주소가 있어 보정한다 */
  const homeHref = homepageUrl
    ? /^https?:\/\//i.test(homepageUrl)
      ? homepageUrl
      : `https://${homepageUrl}`
    : null;

  return (
    <section aria-labelledby="contact-heading" className="px-6">
      <h2 id="contact-heading" className="mb-3 text-sm font-extrabold text-app-text">
        문의
      </h2>

      <ul className="divide-y divide-app-border overflow-hidden rounded-[20px] border border-app-border bg-white">
        {telHref && (
          <li>
            <a
              href={telHref}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-app-bg"
            >
              <Phone size={18} className="shrink-0 text-brand-blue" aria-hidden />
              <span className="flex-1 text-sm font-semibold text-app-text">{phone}</span>
              <span className="text-xs font-bold text-brand-blue">전화</span>
            </a>
          </li>
        )}

        {homeHref && (
          <li>
            <a
              href={homeHref}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-3 p-4 transition-colors hover:bg-app-bg"
            >
              <Globe size={18} className="shrink-0 text-brand-violet" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-app-text">
                {homepageUrl}
              </span>
              <span className="shrink-0 text-xs font-bold text-brand-violet">
                열기<span className="sr-only"> (새 창)</span>
              </span>
            </a>
          </li>
        )}

        {fax && (
          <li className="flex items-center gap-3 p-4">
            <Printer size={18} className="shrink-0 text-app-text-muted" aria-hidden />
            <span className="flex-1 text-sm text-app-text-muted">{fax}</span>
            <span className="text-xs text-app-text-muted">팩스</span>
          </li>
        )}
      </ul>

      <p className="mt-2 text-xs text-app-text-muted">
        미사 시간과 단체 순례는 성지에 직접 확인하시는 것이 정확합니다.
      </p>
    </section>
  );
}
