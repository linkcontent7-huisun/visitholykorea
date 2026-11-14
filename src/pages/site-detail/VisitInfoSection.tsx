import { QuietDaysCard } from '@/features/crowding/components/QuietDaysCard';
import { ContactCard } from '@/features/sites/components/ContactCard';
import { DirectionsCard } from '@/features/sites/components/DirectionsCard';
import { splitMassInfo } from '@/features/sites/lib/mass-info';
import { localizeMassLabel, localizeMassValue } from '@/features/sites/lib/mass-info-localize';
import type { TranslatedSiteView } from '@/features/sites/lib/translated-site';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';

/** 「방문 정보」 — 미사 시간·한적한 날·연락처·찾아가는 길 (#102 에서 페이지에서 떼어 냄) */
export function VisitInfoSection({
  site,
  view,
}: {
  site: HolySite;
  view: TranslatedSiteView | null;
}) {
  const { language, t } = useSettings();
  // 소개글 끝의 「▷ 미사 시간」 문단은 인용문에서 떼어 방문 정보 카드로 보낸다 (2026-09-13)
  const { mass: massInfo } = splitMassInfo(site.description);
  // 「문의」 줄은 바로 아래 연락처 카드와 같은 정보라 뺀다(사장님 지적, 2026-09-17)
  const massRows = massInfo?.rows.filter((row) => row.label !== '문의') ?? [];

  return (
    <section aria-labelledby="visit-info-heading" className="space-y-8">
      <SectionHeading id="visit-info-heading" title={t('visitInfo')} />

      {/* 미사 시간 — 안내 책자 기준. 성지 사정에 따라 바뀔 수 있다.
              줄마다 카드를 나눠 한눈에 훑기 쉽게 하되, 라벨은 알약 배지가 아니라 원래의
              간결한 글자로(사장님 지적, 2026-09-18) — 알약 모양은 시각(時刻) 칩 쪽으로 옮겼다. */}
      {massInfo && massRows.length > 0 && (
        <section aria-labelledby="mass-heading">
          <SectionHeading as="h3" size="md" id="mass-heading" title={t('massTimesTitle')} />
          <SquircleSurface
            as="dl"
            borderColor="var(--color-app-border)"
            className="divide-y divide-app-border overflow-hidden bg-white"
          >
            {massRows.map((row) => (
              <div key={row.label + row.value} className="p-5">
                <dt className="mb-2 text-sm font-bold text-brand-blue">
                  {localizeMassLabel(row.label, language)}
                </dt>
                <dd className="text-base leading-loose text-app-text">
                  {/* 라벨·요일·자주 나오는 구절만 화면 언어로 바꾸고 나머지는 원문 그대로(T-034) */}
                  {localizeMassValue(row.value, language)
                    .split(/(\d{1,2}:\d{2})/g)
                    .map((part, i) =>
                      /^\d{1,2}:\d{2}$/.test(part) ? (
                        <span
                          key={i}
                          className="mx-0.5 inline-flex items-center rounded-full bg-brand-soft px-2 py-0.5 font-bold tabular-nums text-brand-blue"
                        >
                          {part}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                </dd>
              </div>
            ))}
          </SquircleSurface>
        </section>
      )}

      {/* 한적한 날 — 집중률에 이름이 있는 성지만. 미사 시간 바로 아래가 "언제 갈까"를 정하는 자리다 */}
      <QuietDaysCard site={site} />

      {/* 공식 홈페이지·연락처 — 미사 시간·단체 순례는 성지에 직접 물어야 정확하다 */}
      <ContactCard site={site} />

      {/* 주소와 외부 지도 — 외국인 방문자를 기준으로 만든 화면 */}
      <DirectionsCard site={site} addressEnglish={view?.addressRomanized ?? null} />
    </section>
  );
}
