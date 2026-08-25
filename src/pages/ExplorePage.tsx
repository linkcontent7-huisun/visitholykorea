import { Church, ChevronRight, Footprints, Heart, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { useMyFavoriteIds } from '@/features/favorites/hooks/use-favorites';
import { SiteListItem } from '@/features/sites/components/SiteListItem';
import { useSites, useSitesByDiocese } from '@/features/sites/hooks/use-sites';
import { DIOCESES } from '@/shared/types/domain';

const CATEGORIES = ['전체', '순교성지', '역사사적지', '주교좌성당', '순례길'] as const;

export default function ExplorePage() {
  const [selectedDiocese, setSelectedDiocese] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('전체');

  const { data: sites = [], isLoading } = useSitesByDiocese(selectedDiocese, category);

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
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-app-text">탐색</h1>
        <p className="text-sm font-medium text-app-text-muted">전국의 성스러운 자취를 찾아서</p>
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
                  <span className="block text-base font-extrabold">순례 코스</span>
                  <span className="block text-xs opacity-80">박해의 역사를 따라 걷는 길</span>
                </span>
              </span>
              <ChevronRight size={20} aria-hidden />
            </Link>
            <h2 className="mb-6 text-[11px] font-bold uppercase tracking-widest text-app-text-muted">
              교구별 탐색
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

            <div className="mt-2 space-y-8">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="h-28 animate-pulse rounded-[24px] bg-app-bg" />
                ))
              ) : sites.length > 0 ? (
                sites.map((site) => <SiteListItem key={site.id} site={site} />)
              ) : (
                <EmptyState icon={Church} title="아직 등록된 성지가 없습니다." />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
