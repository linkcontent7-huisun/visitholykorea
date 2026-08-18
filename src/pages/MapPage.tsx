import { Check, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { MapLegend, NationalMap } from '@/features/map/components/NationalMap';
import { DioceseProgressList } from '@/features/map/components/DioceseProgressList';
import { useVisitedSites } from '@/features/map/hooks/use-visited';
import { almostSiteIds, buildNudge, computeDioceseProgress } from '@/features/map/lib/progress';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { useSites } from '@/features/sites/hooks/use-sites';

/**
 * 지도 화면 — "내가 어디까지 왔고 어디가 남았나".
 *
 * 여기 쓰는 지도는 길찾기용이 아니라 **조망용**이다(카카오맵 SDK 연동은 ADR 0003 참고).
 * 208곳을 한 화면에 놓고, 다녀온 곳·거의 다 찬 교구에 남은 곳·아직 안 간 곳을
 * 세 가지 핀으로 구분한다. 빈 핀이 채워진 핀 사이에 끼어 있으면 그것만 눈에 띈다 —
 * 문구로 재촉하지 않아도 되는 이유다.
 */
export default function MapPage() {
  const [selectedDiocese, setSelectedDiocese] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: sites = [], isLoading } = useSites({ limit: 300 });
  const { visits, visitedIds, toggle } = useVisitedSites();

  // 진행률은 필터와 무관하게 **전체 기준**으로 센다.
  // 교구를 하나 골랐다고 진행률이 100%가 되면 아무 의미가 없다.
  const progress = useMemo(() => computeDioceseProgress(sites, visitedIds), [sites, visitedIds]);
  const almostIds = useMemo(() => almostSiteIds(progress), [progress]);
  const nudge = useMemo(() => buildNudge(progress), [progress]);

  const visibleSites = useMemo(() => {
    const term = keyword.trim();
    return sites.filter((site) => {
      const dioceseMatch = selectedDiocese === '전체' || site.region === selectedDiocese;
      const keywordMatch = !term || site.name.includes(term) || site.location.includes(term);
      return dioceseMatch && keywordMatch;
    });
  }, [sites, selectedDiocese, keyword]);

  const selectedSite = useMemo(
    () => sites.find((s) => s.id === selectedId) ?? null,
    [sites, selectedId],
  );

  const totalVisited = visitedIds.size;

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <div className="p-6 pb-2">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-app-text">순례 지도</h1>
        <p className="text-sm text-app-text-muted">
          {isLoading ? '불러오는 중…' : `${sites.length}곳 가운데 ${totalVisited}곳을 다녀오셨습니다`}
        </p>

        {nudge && (
          <p className="mt-3 rounded-2xl bg-brand-violet/10 px-4 py-3 text-sm font-semibold text-brand-violet">
            {nudge}
          </p>
        )}
      </div>

      {/* 조망 지도 */}
      <div className="px-6">
        <div className="rounded-[24px] border border-app-border bg-white p-4">
          {isLoading ? (
            <div className="h-72 animate-pulse rounded-2xl bg-app-bg" />
          ) : (
            <NationalMap
              sites={sites}
              visits={visits}
              visitedIds={visitedIds}
              almostIds={almostIds}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}
          <div className="mt-3 border-t border-app-border pt-3">
            <MapLegend />
          </div>
        </div>
      </div>

      {/* 핀을 누르면 나오는 카드. 구글맵처럼 정보보다 행동이 먼저 온다. */}
      {selectedSite && (
        <div className="mt-4 px-6">
          <div className="rounded-[24px] border border-brand-blue/30 bg-white p-5 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase tracking-tight text-brand-violet">
              {selectedSite.region} · {selectedSite.category}
            </span>
            <h2 className="mt-0.5 text-base font-bold text-app-text">{selectedSite.name}</h2>
            <p className="mt-1 text-sm text-app-text-muted">{selectedSite.location}</p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => toggle(selectedSite.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                  visitedIds.has(selectedSite.id)
                    ? 'bg-brand-blue text-white'
                    : 'border border-app-border bg-white text-app-text hover:border-brand-violet'
                }`}
              >
                <Check size={16} />
                {visitedIds.has(selectedSite.id) ? '다녀옴' : '다녀왔어요'}
              </button>
              <Link
                to={paths.siteDetail(selectedSite.id)}
                className="flex flex-1 items-center justify-center rounded-2xl border border-app-border bg-white px-4 py-3 text-sm font-bold text-app-text hover:border-brand-violet"
              >
                자세히
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 교구별 진행 */}
      <div className="mt-6 px-6">
        <h2 className="mb-3 text-sm font-extrabold text-app-text">교구별 진행</h2>
        <DioceseProgressList
          progress={progress}
          selectedDiocese={selectedDiocese}
          onSelectDiocese={(d) => setSelectedDiocese(d === selectedDiocese ? '전체' : d)}
        />
      </div>

      {/* 목록 — 지도가 안 뜨거나 이름으로 찾고 싶을 때의 길 */}
      <div className="mt-8 px-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="성지 이름 검색"
            aria-label="성지 이름 검색"
            className="w-full rounded-[20px] border border-app-border bg-white py-3.5 pl-12 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
          />
        </div>

        {selectedDiocese !== '전체' && (
          <button
            type="button"
            onClick={() => setSelectedDiocese('전체')}
            className="mt-3 rounded-full border border-brand-blue bg-brand-blue px-4 py-2 text-xs font-bold text-white"
          >
            {selectedDiocese} × 전체 보기
          </button>
        )}
      </div>

      <div className="space-y-3 p-6 pb-32">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-[24px] bg-white" />)
        ) : visibleSites.length === 0 ? (
          <p className="py-16 text-center text-sm font-medium text-app-text-muted">
            조건에 맞는 성지가 없습니다.
          </p>
        ) : (
          visibleSites.map((site) => (
            <Link
              key={site.id}
              to={paths.siteDetail(site.id)}
              className="flex items-center gap-4 rounded-[24px] border border-app-border bg-white p-4 shadow-sm transition-all hover:shadow-md"
              id={`map-item-${site.id}`}
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-app-bg text-brand-violet">
                {site.imageUrl ? (
                  <SiteThumbnail
                    imageUrl={site.imageUrl}
                    name={site.name}
                    category={site.category}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MapPin size={20} />
                )}
                {visitedIds.has(site.id) && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-brand-blue text-white"
                    aria-label="다녀옴"
                  >
                    <Check size={12} />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-extrabold uppercase tracking-tight text-brand-violet">
                  {site.category}
                </span>
                <h4 className="truncate text-sm font-bold text-app-text">{site.name}</h4>
                <p className="mt-0.5 truncate text-xs text-app-text-muted">{site.location}</p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
