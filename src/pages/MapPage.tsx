import { Map as MapIcon, MapPin, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { useSites } from '@/features/sites/hooks/use-sites';

/**
 * 지도 화면.
 *
 * 실제 지도 렌더링(카카오맵 SDK)은 아직 붙지 않았다 — 진행 상황과 결정 배경은
 * docs/20-architecture/adr/0003-map-provider.md 참고. 그때까지는 좌표가 확보된
 * 성지를 목록으로 보여준다(예전의 가짜 핀·가짜 카드는 제거했다).
 */
export default function MapPage() {
  const [selectedDiocese, setSelectedDiocese] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const { data: sites = [], isLoading } = useSites({ limit: 300 });

  // 교구 목록은 상수가 아니라 실제 데이터에서 뽑는다 — 성지가 하나도 없는 교구를
  // 필터로 보여주면 눌렀을 때 빈 화면만 나온다.
  const dioceses = useMemo(() => {
    const found = new Set(sites.map((s) => s.region).filter(Boolean));
    return ['전체', ...[...found].sort()];
  }, [sites]);

  const visibleSites = useMemo(() => {
    const term = keyword.trim();
    return sites.filter((site) => {
      const dioceseMatch = selectedDiocese === '전체' || site.region === selectedDiocese;
      const keywordMatch = !term || site.name.includes(term) || site.location.includes(term);
      return dioceseMatch && keywordMatch;
    });
  }, [sites, selectedDiocese, keyword]);

  const locatedSites = visibleSites.filter(
    (site) => site.coordinates.lat != null && site.coordinates.lng != null,
  );

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <div className="p-8 pb-2">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-app-text">
          교구별 성지 지도
        </h1>
        <p className="mb-5 text-[12px] text-app-text-muted">교구를 선택해서 순례지를 둘러보세요</p>

        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="성지 이름 검색"
            aria-label="성지 이름 검색"
            className="w-full rounded-[20px] border border-app-border bg-white/95 py-4 pl-14 pr-4 text-sm font-semibold shadow-2xl shadow-gray-200/50 backdrop-blur-lg transition-all focus:outline-none focus:ring-2 focus:ring-brand-violet/50"
          />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto py-5">
          {dioceses.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDiocese(d)}
              className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-xs font-bold transition-all ${
                selectedDiocese === d
                  ? 'border-brand-blue bg-brand-blue text-white shadow-lg shadow-brand-blue/10'
                  : 'border-app-border bg-white text-app-text-muted hover:border-brand-violet'
              }`}
              id={`map-filter-${d}`}
            >
              {d === '전체' ? '전국' : d}
            </button>
          ))}
        </div>
      </div>

      {/* 지도 자리. 카카오맵 SDK 연동 시 이 영역을 교체한다. */}
      <div className="relative mx-8 flex h-40 items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-app-border bg-white">
        <div className="flex flex-col items-center gap-2 text-center">
          <MapIcon size={36} className="text-brand-blue/20" />
          <p className="text-xs font-bold text-app-text-muted">
            지도 연동 준비 중 · 좌표가 확인된 성지 {locatedSites.length}곳
          </p>
        </div>
      </div>

      <div className="space-y-3 p-8 pb-32">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[24px] bg-white" />
          ))
        ) : visibleSites.length === 0 ? (
          <p className="py-16 text-center text-sm font-medium text-app-text-muted">
            조건에 맞는 성지가 없습니다.
          </p>
        ) : (
          visibleSites.map((site) => (
            <Link
              key={site.id}
              to={paths.siteDetail(site.id)}
              className="flex items-center gap-5 rounded-[24px] border border-app-border bg-white p-5 shadow-sm transition-all hover:shadow-md"
              id={`map-item-${site.id}`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-app-bg text-brand-violet">
                {site.imageUrl ? (
                  <SiteThumbnail
                    imageUrl={site.imageUrl}
                    name={site.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <MapPin size={20} />
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
