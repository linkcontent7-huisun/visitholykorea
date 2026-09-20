import { SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import type { HolySite } from '@/shared/types/domain';
import { useNearbyCrowding } from '../hooks/use-nearby-crowding';

/** YYYYMMDD → 한국 날짜로 「9/23 (화)」. 요일이 핵심 정보다 — 순례자는 "평일에 가라"로 읽는다. */
function formatQuietDay(ymd: string, locale: string): string {
  const date = new Date(
    Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(4, 6)) - 1, Number(ymd.slice(6, 8)), 12),
  );
  return new Intl.DateTimeFormat(locale, {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

/**
 * 「한적한 날」 — 이 성지가 앞으로 30일 중 조용하다고 예측된 날짜 알약.
 *
 * 집중률은 같은 장소의 날짜끼리 비교하는 데 맞는 지표라(2026-09-21 검토) 오버투어리즘 답변을
 * "어디로"가 아니라 "언제"로 낸다. 이름 등재 성지(32곳, 9/21 실측)에만 값이 있고, 없으면 아무것도
 * 그리지 않는다 — 빈 카드나 "데이터 없음" 카드로 자리를 차지하지 않는다.
 * 라벨(`NearbyCrowdingLabel`)과 같은 조회를 쓰므로 호출은 늘지 않는다.
 */
export function QuietDaysCard({ site }: { site: HolySite }) {
  const { t, language } = useSettings();
  const { data, quietDays } = useNearbyCrowding(site);
  if (!data?.level || quietDays.length === 0) return null;
  const locale = SPEECH_LOCALE[language];

  return (
    <section aria-labelledby="quiet-days-heading">
      <SquircleSurface borderColor="var(--color-app-border)" className="bg-white p-5">
        <h3 id="quiet-days-heading" className="mb-3 text-sm font-bold text-brand-blue">
          {t('quietDaysTitle')}
        </h3>
        <ul className="flex flex-wrap gap-2">
          {quietDays.map((ymd) => (
            <li
              key={ymd}
              className="inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-base font-bold tabular-nums text-brand-blue"
            >
              {formatQuietDay(ymd, locale)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-app-text-muted">{t('quietDaysNote')}</p>
      </SquircleSurface>
    </section>
  );
}
