import { Check, MapPin, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { MapLegend, NationalMap } from '@/features/map/components/NationalMap';
import { DioceseProgressList } from '@/features/map/components/DioceseProgressList';
import { useVisitedSites } from '@/features/map/hooks/use-visited';
import { almostSiteIds, buildNudge, computeDioceseProgress } from '@/features/map/lib/progress';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { useSites } from '@/features/sites/hooks/use-sites';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { useFeaturedPhotos } from '@/features/sites/hooks/use-featured-photos';
import type { HolySite } from '@/shared/types/domain';

/**
 * 지도 화면 — "내가 어디까지 왔고 어디가 남았나".
 *
 * 여기 쓰는 지도는 길찾기용이 아니라 **조망용**이다(카카오맵 SDK 연동은 ADR 0003 참고).
 * 208곳을 한 화면에 놓고, 다녀온 곳·거의 다 찬 교구에 남은 곳·아직 안 간 곳을
 * 세 가지 핀으로 구분한다.
 *
 * ## 반응형 (시안 1c · 지도 우선 분할)
 * 모바일은 지금까지처럼 위에서 아래로 흐른다: 지도 → 선택 카드 → 교구 진행 → 목록.
 * 데스크톱(1024px 이상)에서는 **왼쪽 452px 목록 + 오른쪽 지도**로 접힌다. 순례 계획은
 * 결국 "어디서 어디로"의 문제이고, 목록과 지도를 동시에 보는 것은 모바일로는 만들 수
 * 없는 유일한 가치다.
 *
 * 지도를 두 벌 그리지 않는다 — 같은 노드를 폭에 따라 다른 자리에 꽂는다. 208개 핀의
 * SVG 를 두 번 그리면 그만큼 느려지고, 이것은 배치가 아니라 성능의 문제라서
 * `wideView`(matchMedia, 첫 렌더에서 이미 값이 정해져 있어 깜빡임이 없다)를 쓴다.
 */
export default function MapPage() {
  // 공식 사진이 없는 성지는 순례자가 보내준(승인된) 사진으로 채운다
  const { data: featured = {} } = useFeaturedPhotos();
  const { t, wideView } = useSettings();
  const [selectedDiocese, setSelectedDiocese] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: sites = [], isLoading } = useSites({ limit: 300 });
  const { visits, visitedIds, toggle } = useVisitedSites();

  // 진행률은 필터와 무관하게 **전체 기준**으로 센다.
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

  /**
   * 핀을 눌렀을 때 왼쪽 목록에서 그 성지가 보이도록 목록만 스크롤한다.
   * `scrollIntoView` 는 페이지 전체를 움직여 지도까지 튀게 만들므로 쓰지 않고,
   * 목록 컨테이너의 `scrollTop` 을 직접 계산한다.
   */
  const listRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (!wideView || !selectedId) return;
    const list = listRef.current;
    const row = rowRefs.current[selectedId];
    if (!list || !row) return;
    list.scrollTop = row.offsetTop - list.clientHeight / 2 + row.clientHeight / 2;
  }, [selectedId, wideView]);

  /** 지도 노드 — 폭에 따라 꽂히는 자리만 달라진다. */
  const mapNode = isLoading ? (
    <div className="h-72 w-full animate-pulse rounded-2xl bg-app-bg" />
  ) : (
    <NationalMap
      sites={sites}
      visits={visits}
      visitedIds={visitedIds}
      almostIds={almostIds}
      selectedId={selectedId}
      onSelect={setSelectedId}
    />
  );

  /** 핀·목록에서 고른 성지 카드. 구글맵처럼 정보보다 행동이 먼저 온다. */
  const selectedCard = selectedSite && (
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
          {visitedIds.has(selectedSite.id) ? t('visited') : t('markVisited')}
        </button>
        <Link
          to={paths.siteDetail(selectedSite.id)}
          className="flex flex-1 items-center justify-center rounded-2xl border border-app-border bg-white px-4 py-3 text-sm font-bold text-app-text hover:border-brand-violet"
        >
          자세히
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-app-bg lg:flex lg:h-[calc(100dvh-72px)] lg:overflow-hidden">
      {/* ── 왼쪽(데스크톱) / 위아래 흐름(모바일) ───────────────────────── */}
      <div
        ref={listRef}
        className="relative lg:w-[452px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-app-border lg:bg-white"
      >
        <div className="p-6 pb-2">
          <h1 className="mb-1 text-xl font-extrabold tracking-tight text-app-text">
            {t('mapTitle')}
          </h1>
          <p className="text-sm text-app-text-muted">
            {isLoading
              ? t('loading')
              : fillPlaceholders(t('mapProgress'), { n: totalVisited, total: sites.length })}
          </p>

          {nudge && (
            <p className="mt-3 rounded-2xl bg-brand-violet/10 px-4 py-3 text-sm font-semibold text-brand-violet">
              {nudge}
            </p>
          )}
        </div>

        {/* 지도 — 모바일에서만 여기에 온다 */}
        {!wideView && (
          <div className="px-6">
            <div className="rounded-[24px] border border-app-border bg-white p-4">
              {mapNode}
              <div className="mt-3 border-t border-app-border pt-3">
                <MapLegend />
              </div>
            </div>
          </div>
        )}

        {/* 선택 카드 — 모바일에서만 여기에 온다(데스크톱은 지도 위에 뜬다) */}
        {!wideView && selectedCard && <div className="mt-4 px-6">{selectedCard}</div>}

        {/* 검색 */}
        <div className="mt-6 px-6 lg:mt-2">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder={t('mapSearchSite')}
              aria-label={t('mapSearchSite')}
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

        {/* 목록 — 데스크톱에서는 마우스를 올리면 지도의 핀이 함께 강조된다 */}
        <div className="space-y-3 p-6 pb-32 lg:pb-6">
          {isLoading ? (
            [1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-[24px] bg-white" />)
          ) : visibleSites.length === 0 ? (
            <p className="py-16 text-center text-sm font-medium text-app-text-muted">
              조건에 맞는 성지가 없습니다.
            </p>
          ) : (
            visibleSites.map((site) => (
              <MapListRow
                key={site.id}
                site={site}
                photoUrl={featured[site.id] ?? null}
                visited={visitedIds.has(site.id)}
                visitedLabel={t('visited')}
                active={site.id === selectedId}
                onHover={() => wideView && setSelectedId(site.id)}
                rowRef={(el) => {
                  rowRefs.current[site.id] = el;
                }}
              />
            ))
          )}
        </div>

        {/* 교구별 진행 — 데스크톱에서는 목록 아래에 계속 둔다 */}
        <div className="px-6 pb-10 lg:pb-8">
          <h2 className="mb-3 text-sm font-extrabold text-app-text">{t('dioceseProgress')}</h2>
          <DioceseProgressList
            progress={progress}
            selectedDiocese={selectedDiocese}
            onSelectDiocese={(d) => setSelectedDiocese(d === selectedDiocese ? '전체' : d)}
          />
        </div>
      </div>

      {/* ── 오른쪽(데스크톱 전용) 지도 ─────────────────────────────────── */}
      {wideView && (
        <div className="relative hidden flex-1 items-center justify-center bg-app-bg p-10 lg:flex">
          <div className="w-full max-w-[620px]">{mapNode}</div>

          <div className="absolute bottom-6 left-8 rounded-2xl border border-app-border bg-white/95 px-5 py-3 backdrop-blur-md">
            <MapLegend />
          </div>

          {selectedCard && <div className="absolute bottom-6 right-8 w-[320px]">{selectedCard}</div>}
        </div>
      )}
    </div>
  );
}

/** 목록 한 줄. 선택된 줄은 왼쪽 띠로 표시한다 — 지도의 핀과 짝이 맞는다. */
function MapListRow({
  site,
  photoUrl,
  visited,
  visitedLabel,
  active,
  onHover,
  rowRef,
}: {
  site: HolySite;
  photoUrl: string | null;
  visited: boolean;
  visitedLabel: string;
  active: boolean;
  onHover: () => void;
  rowRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div ref={rowRef} onMouseEnter={onHover}>
      <Link
        to={paths.siteDetail(site.id)}
        className={`flex items-center gap-4 rounded-[24px] border bg-white p-4 shadow-sm transition-all hover:shadow-md ${
          active ? 'border-brand-blue ring-1 ring-brand-blue/20' : 'border-app-border'
        }`}
        id={`map-item-${site.id}`}
      >
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-app-bg text-brand-violet">
          {site.imageUrl ? (
            <SiteThumbnail
              imageUrl={site.imageUrl}
              pilgrimUrl={photoUrl}
              name={site.name}
              category={site.category}
              className="h-full w-full object-cover"
            />
          ) : (
            <MapPin size={20} />
          )}
          {visited && (
            <span
              className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-brand-blue text-white"
              aria-label={visitedLabel}
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
    </div>
  );
}
