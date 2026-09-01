import { Car, Church, ChevronRight, Footprints, Heart, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useMyFavoriteIds } from '@/features/favorites/hooks/use-favorites';
import { SiteListItem } from '@/features/sites/components/SiteListItem';
import { fetchSiteDioceseIndex } from '@/features/sites/api/holy-sites.repository';
import { countByDiocese } from '@/features/sites/lib/diocese-count';
import { sortByDistance } from '@/features/sites/lib/nearest';
import { queryKeys } from '@/shared/api/query-keys';
import { useSites, useSitesByDiocese } from '@/features/sites/hooks/use-sites';
import { fillPlaceholders, SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { formatDuration } from '@/shared/lib/geo';
import { regionCoords } from '@/shared/lib/regions';
import { DIOCESES } from '@/shared/types/domain';

const CATEGORIES = ['전체', '순교성지', '역사사적지', '주교좌성당', '순례길'] as const;

export default function ExplorePage() {
  const { t, language, origin } = useSettings();

  // 교구 카드에 성지 수를 붙인다. 목록 전체가 아니라 id·교구만 받아 가볍다.
  const { data: dioceseIndex = [] } = useQuery({
    queryKey: queryKeys.sites.dioceseIndex(),
    queryFn: fetchSiteDioceseIndex,
    staleTime: 1000 * 60 * 60,
  });
  const dioceseCounts = useMemo(() => countByDiocese(dioceseIndex), [dioceseIndex]);
  const [selectedDiocese, setSelectedDiocese] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('전체');

  const { data: sites = [], isLoading } = useSitesByDiocese(selectedDiocese, category);

  /**
   * 가까운 순 정렬 — 수요조사 자유의견 1호 "내 위치부터 소요시간별로 정리".
   * 출발지(시·도)를 정해 둔 사람에게만 토글을 보여준다. 홈의 "가까운 성지"와
   * 같은 출발지를 쓰므로 두 화면의 거리 감각이 어긋나지 않는다.
   */
  const [nearestFirst, setNearestFirst] = useState(false);
  const from = regionCoords(origin);
  const sorted = useMemo(() => {
    if (!nearestFirst || !from) return null;
    return sortByDistance(sites, from);
  }, [nearestFirst, from, sites]);

  // 즐겨찾기 — 찜해 둔 성지를 교구를 고르기 전 화면 맨 위에 모아 보여준다
  const { data: favoriteIds = [] } = useMyFavoriteIds();
  const { data: allSites = [] } = useSites({ limit: 300 });
  const favoriteSites = useMemo(() => {
    if (favoriteIds.length === 0) return [];
    const order = new Map(favoriteIds.map((id, i) => [id, i]));
    return allSites
      .filter((s) => order.has(s.id))
      .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  }, [favoriteIds, allSites]);

  return (
    <div className="min-h-screen bg-white">
      <header className="p-8 pb-4">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-app-text">{t('exploreTitle')}</h1>
        <p className="text-sm font-medium text-app-text-muted">{t('exploreSubtitle')}</p>
      </header>

      <div className="px-8 py-4">
        {!selectedDiocese ? (
          <div>
            {favoriteSites.length > 0 && (
              <section className="mb-8">
                <div className="mb-4 flex items-center gap-2">
                  <Heart size={16} className="fill-pink-500 text-pink-500" aria-hidden />
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-app-text">
                    즐겨찾는 성지
                  </h2>
                </div>
                <div className="space-y-5">
                  {favoriteSites.map((site) => (
                    <SiteListItem key={site.id} site={site} />
                  ))}
                </div>
              </section>
            )}

            {/* 순례 코스 진입점 — 낱개 성지가 아니라 이야기 순서로 걷고 싶은 사람을 위해 */}
            <Link
              to={paths.routes}
              className="mb-8 flex items-center justify-between rounded-[16px] bg-brand-violet p-5 text-white transition-opacity hover:opacity-90"
            >
              <span className="flex items-center gap-3">
                <Footprints size={22} aria-hidden />
                <span>
                  <span className="block text-base font-extrabold">{t('routesTitle')}</span>
                  <span className="block text-xs opacity-80">{t('routesSubtitle')}</span>
                </span>
              </span>
              <ChevronRight size={20} aria-hidden />
            </Link>
            <h2 className="mb-6 text-[11px] font-bold uppercase tracking-widest text-app-text-muted">
              {t('byDiocese')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {DIOCESES.map((diocese) => (
                <button
                  key={diocese}
                  onClick={() => setSelectedDiocese(diocese)}
                  className="group flex aspect-square flex-col items-center justify-center gap-2 rounded-[16px] border border-transparent bg-app-bg transition-all hover:border-brand-violet hover:bg-[#F3F0FF] hover:text-brand-violet"
                  id={`diocese-${diocese}`}
                >
                  <MapPin
                    size={24}
                    className="text-gray-300 transition-all group-hover:scale-110 group-hover:text-brand-violet"
                  />
                  <span className="text-xs font-bold text-app-text-muted group-hover:text-brand-violet">
                    {diocese}
                  </span>
                  {/* 숫자가 없으면 어느 교구를 눌러야 할지 판단할 근거가 없다 */}
                  {dioceseCounts[diocese] != null && (
                    <span className="text-[10px] font-bold text-gray-300 group-hover:text-brand-violet/60">
                      {dioceseCounts[diocese]}곳
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedDiocese(null)}
              className="group mb-8 flex items-center gap-2 text-sm font-bold text-brand-blue"
              id="back-to-diocese"
            >
              <ChevronRight
                size={20}
                className="rotate-180 transition-transform group-hover:-translate-x-1"
              />
              {selectedDiocese} 교구 목록
            </button>

            <div className="no-scrollbar -mx-8 flex gap-2 overflow-x-auto px-8 pb-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`whitespace-nowrap rounded-xl border px-5 py-2.5 text-xs font-bold transition-all ${
                    category === cat
                      ? 'border-brand-blue bg-brand-blue text-white shadow-lg shadow-brand-blue/10'
                      : 'border-app-border bg-white text-app-text-muted hover:border-brand-violet'
                  }`}
                  id={`filter-${cat}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 출발지를 정한 사람에게만 — 없으면 거리를 잴 기준이 없다 */}
            {from && sites.length > 1 && (
              <div className="mb-6 flex items-center gap-2">
                {(
                  [
                    [false, t('sortDefault')],
                    [true, t('sortNearest')],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={label}
                    onClick={() => setNearestFirst(mode)}
                    className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-extrabold transition-all ${
                      nearestFirst === mode
                        ? 'border-brand-violet bg-brand-violet text-white'
                        : 'border-app-border bg-white text-app-text-muted'
                    }`}
                    id={mode ? 'sort-nearest' : 'sort-default'}
                  >
                    {mode && <Car size={12} aria-hidden />}
                    {label}
                  </button>
                ))}
                {nearestFirst && (
                  <span className="text-[11px] font-medium text-app-text-muted">{origin} →</span>
                )}
              </div>
            )}

            <div className="mt-2 space-y-8">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-[24px] bg-app-bg" />
                ))
              ) : sites.length === 0 ? (
                <EmptyState icon={Church} title={t('noSites')} />
              ) : sorted ? (
                <>
                  {sorted.measured.map(({ site, km, driveMin }) => (
                    <SiteListItem
                      key={site.id}
                      site={site}
                      meta={`${Math.round(km)}km · ${fillPlaceholders(t('byCarAbout'), {
                        duration: formatDuration(driveMin, SPEECH_LOCALE[language]),
                      })}`}
                    />
                  ))}
                  {sorted.unmeasured.map((site) => (
                    <SiteListItem key={site.id} site={site} />
                  ))}
                </>
              ) : (
                sites.map((site) => <SiteListItem key={site.id} site={site} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
