/**
 * 축제 가는 김에 — 오늘 열리는 축제 옆에 그 지역 성지를 붙여 보여주는 화면.
 *
 * 「붐빔 피하기」(`/alternatives`)와 한 쌍이다. 그쪽은 붐비는 곳을 **피해서** 성지로
 * 보내고, 이쪽은 사람이 이미 모인 행사에서 성지로 **끌어온다.** 관광데이터를
 * 순례 수요로 바꾸는 두 방향을 모두 보여주기 위한 화면이다.
 *
 * 🔴 축제 데이터는 한국관광공사 TourAPI 실시간 응답이다. 저장하지 않는다(ADR 0002).
 */

import { ArrowLeft, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFestivalPairs } from '@/features/festivals/api/use-festivals';
import { FestivalCard } from '@/features/festivals/components/FestivalCard';
import { RegionFilterChips } from '@/features/festivals/components/RegionFilterChips';
import { useSites } from '@/features/sites/hooks/use-sites';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import type { Region } from '@/shared/lib/regions';

export default function FestivalsPage() {
  const navigate = useNavigate();
  const { t, wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  // 기본은 「전체」다. 출발지 시·도부터 보여주면 더 친절해 보이지만, 그 지역에 오늘
  // 축제가 없는 사람(광주·울산·세종은 실제로 0건이었다)은 화면을 열자마자 빈 화면을
  // 만난다. 처음 오는 사람에게는 "여기 볼 게 있다"를 먼저 보여주고, 좁히는 것은
  // 본인이 고르게 한다.
  const [region, setRegion] = useState<Region | null>(null);

  // 성지는 우리 자체 데이터라 저장·캐싱에 제약이 없다. 좌표만 있으면 되므로 넓게 받는다.
  const { data: sites = [] } = useSites({ limit: 300 });
  const { pairs, isLoading, isError } = useFestivalPairs(sites, region);

  return (
    <div className={`mx-auto flex min-h-screen ${widthClass} flex-col bg-app-bg`}>
      {/* 높이를 고정하지 않는다 — 큰 글자 모드나 긴 번역문(프랑스어)에서 제목이 잘리지 않게. */}
      <header className="flex min-h-20 shrink-0 items-center gap-3 border-b border-app-border bg-white px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-app-text-muted hover:text-app-text"
          aria-label={t('back')}
        >
          <ArrowLeft size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-extrabold leading-snug tracking-tight text-app-text">
            {t('festivalsTitle')}
          </h1>
          <p className="text-xs leading-snug text-app-text-muted">{t('festivalsSubtitle')}</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <RegionFilterChips
          value={region}
          onChange={setRegion}
          allLabel={t('festivalsRegionAll')}
          groupLabel={t('festivalsRegionLabel')}
        />

        {isLoading && (
          <div className="mt-6 space-y-3" role="status" aria-live="polite">
            <p className="text-sm font-medium text-app-text-muted">{t('festivalsLoading')}</p>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-[20px] bg-white" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="mt-6 rounded-[20px] border border-app-border bg-white p-6 text-center">
            <p className="text-sm font-bold text-app-text">{t('festivalsError')}</p>
            <p className="mt-2 text-xs leading-relaxed text-app-text-muted">
              {t('festivalsErrorHint')}
            </p>
          </div>
        )}

        {/* 결과가 없으면 정직하게 없다고 쓴다. 가짜 카드·자리표시어를 넣지 않는다. */}
        {!isLoading && !isError && pairs.length === 0 && (
          <div className="mt-6 rounded-[20px] border border-dashed border-app-border bg-white p-8 text-center">
            <PartyPopper size={28} className="mx-auto mb-4 text-gray-300" aria-hidden />
            <p className="text-sm font-bold leading-relaxed text-app-text">{t('festivalsEmpty')}</p>
            <p className="mt-2 text-xs text-app-text-muted">{t('festivalsEmptyHint')}</p>
          </div>
        )}

        {!isLoading && !isError && pairs.length > 0 && (
          <>
            <p className="mt-5 text-xs font-bold text-app-text-muted">
              {fillPlaceholders(t('festivalsFound'), { n: pairs.length })}
            </p>
            <div className="mt-3 space-y-4">
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
        <p className="mt-6 text-center text-xs leading-relaxed text-app-text-muted">
          {t('festivalsSource')}
        </p>
      </div>
    </div>
  );
}
