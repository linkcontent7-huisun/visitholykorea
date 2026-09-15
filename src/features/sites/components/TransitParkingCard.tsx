import { Bus, Phone } from 'lucide-react';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';

/**
 * 대중교통과 주차.
 *
 * 자체 DB 에는 아직 대중교통 노선·주차 가능 여부 칸이 없다(2026-09-14). 그래서 이 카드는
 * 있는 척하지 않고 **"확인되지 않음"** 을 적고, 답을 아는 곳(성지 사무실 전화)과
 * 대중교통 길찾기가 되는 곳(외부 지도)으로 이어 준다 — 재기획 §8 "정보가 없으면 임의로
 * 채우지 않고 확인되지 않음 또는 공식 문의 경로를 표시한다".
 *
 * 나중에 `holy_sites` 에 transit·parking 칸이 생기면 여기서 그 값을 먼저 보여주면 된다.
 */
export function TransitParkingCard({ site }: { site: HolySite }) {
  const { t } = useSettings();
  const telHref = site.phone ? `tel:${site.phone.replace(/[^0-9+]/g, '')}` : null;

  return (
    <section aria-labelledby="transit-heading">
      <h2
        id="transit-heading"
        className="mb-3 flex items-center gap-2 text-sm font-extrabold text-app-text"
      >
        <Bus size={16} className="text-brand-blue" aria-hidden />
        {t('transitParkingTitle')}
      </h2>
      <div className="rounded-[20px] border border-dashed border-app-border bg-white p-4">
        <p className="text-sm leading-relaxed text-app-text-muted">{t('transitParkingUnknown')}</p>
        <p className="mt-2 text-xs leading-relaxed text-app-text-muted">{t('transitParkingHint')}</p>
        {telHref && (
          <a
            href={telHref}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-app-border px-4 text-sm font-bold text-brand-blue"
          >
            <Phone size={14} aria-hidden />
            {site.phone}
          </a>
        )}
      </div>
    </section>
  );
}
