/**
 * 축제 가는 김에 — 오늘 열리는 축제 옆에 그 지역 성지를 붙여 보여주는 화면.
 *
 * 「붐빔 피하기」(`/alternatives`)와 한 쌍이다. 그쪽은 붐비는 곳을 **피해서** 성지로
 * 보내고, 이쪽은 사람이 이미 모인 행사에서 성지로 **끌어온다.** 관광데이터를
 * 순례 수요로 바꾸는 두 방향을 모두 보여주기 위한 화면이다.
 *
 * 🔴 축제 데이터는 한국관광공사 TourAPI 실시간 응답이다. 저장하지 않는다(ADR 0002).
 */

import { PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useFestivalPairs } from '@/features/festivals/api/use-festivals';
import { FestivalCard } from '@/features/festivals/components/FestivalCard';
import { RegionFilterChips } from '@/features/festivals/components/RegionFilterChips';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import type { Region } from '@/shared/lib/regions';

export default function FestivalsPage() {
  const { t } = useSettings();

  // 기본은 「전체」다. 출발지 시·도부터 보여주면 더 친절해 보이지만, 그 지역에 오늘
  // 축제가 없는 사람(광주·울산·세종은 실제로 0건이었다)은 화면을 열자마자 빈 화면을
  // 만난다. 처음 오는 사람에게는 "여기 볼 게 있다"를 먼저 보여주고, 좁히는 것은
  // 본인이 고르게 한다.
  const [region, setRegion] = useState<Region | null>(null);

  // 성지는 우리 자체 데이터라 저장·캐싱에 제약이 없다. 좌표만 있으면 되므로 넓게 받는다.
  const { data: sitesRaw = [] } = useSites({ limit: 300 });
  const sites = useLocalizedSites(sitesRaw);
  const { pairs, isLoading, isError } = useFestivalPairs(sites, region);

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title={t('festivalsTitle')} sub={t('festivalsSubtitle')} />

      <div>
        <RegionFilterChips
          value={region}
          onChange={setRegion}
          allLabel={t('festivalsRegionAll')}
          groupLabel={t('festivalsRegionLabel')}
        />

        {isLoading && (
          <div className="mt-6 space-y-3" role="status" aria-live="polite">
            <p className="text-base text-app-text-muted">{t('festivalsLoading')}</p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-white" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="mt-6 rounded-lg border border-app-border bg-white">
            <EmptyState
              compact
              role="alert"
              title={t('festivalsError')}
              description={t('festivalsErrorHint')}
            />
          </div>
        )}

        {/* 결과가 없으면 정직하게 없다고 쓴다. 가짜 카드·자리표시어를 넣지 않는다. */}
        {!isLoading && !isError && pairs.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed border-app-border bg-white">
            <EmptyState
              compact
              role="status"
              icon={PartyPopper}
              title={t('festivalsEmpty')}
              description={t('festivalsEmptyHint')}
            />
          </div>
        )}

        {!isLoading && !isError && pairs.length > 0 && (
          <>
            <p className="mt-5 text-sm font-bold text-app-text-muted">
              {fillPlaceholders(t('festivalsFound'), { n: pairs.length })}
            </p>
            <div className="mt-3 space-y-3">
              {pairs.map((festival) => (
                <FestivalCard
                  key={festival.id}
                  festival={festival}
                  nearbyLabel={t('festivalsNearbySites')}
                />
              ))}
            </div>
          </>
        )}

        {/* 출처 — 붐빔 피하기 화면과 같은 형식으로 남긴다 */}
        <p className="mt-6 text-center text-sm leading-relaxed text-app-text-muted">
          {t('festivalsSource')}
        </p>
      </div>
    </PageContainer>
  );
}
