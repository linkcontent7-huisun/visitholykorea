import { ChevronLeft, ChevronRight, Compass, Headphones, MapPin } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { getDocentScript } from '@/features/docent/data/scripts';
import { TodayQuietSection } from '@/features/quiet/components/TodayQuietSection';
import { SiteGridCard } from '@/features/sites/components/SiteGridCard';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { regionCoords } from '@/shared/lib/regions';
import { haversineKm } from '@/shared/lib/geo';

/** 하루 단위로 바뀌는 값. 날짜가 바뀌면 히어로에 뜨는 성지도 바뀐다. */
function dayIndex(): number {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24));
}

export default function HomePage() {
  const { origin, gpsLocation, language, t } = useSettings();

  const { data: sitesRaw = [] } = useSites({ limit: 6 });
  const sites = useLocalizedSites(sitesRaw);
  // 붐빔 지수는 좌표가 있는 성지 전체를 후보로 삼는다. 실제 API 호출은
  // 상위 후보 몇 곳에만 일어나므로 목록을 넓게 가져와도 부담이 없다.
  // 300곳을 한 번에 번역해 두면 TodayQuietSection·nearbyFirst 등 아래 여러 곳이
  // 각자 다시 조회하지 않고 같은 번역 결과를 재사용한다.
  const { data: allSitesRaw = [] } = useSites({ limit: 300 });
  const allSites = useLocalizedSites(allSitesRaw);
  // 히어로 사진은 "사진이 있는 성지"만 후보가 된다 — 사진 없는 곳이 뽑히면 안 된다.
  const { data: imagedSites = [] } = useSites({ limit: 100, withImageOnly: true });

  /**
   * 오늘 소개하는 성지 다섯 곳. 사진이 있는 곳 중에서 날짜로 회전시켜 매일 바뀐다.
   * 모바일에서는 좌우로 넘겨보는 캐러셀로, 데스크톱에서는 그중 첫 곳만 큰 히어로로 쓴다.
   */
  const heroSitesRaw = useMemo(() => {
    if (imagedSites.length === 0) return [];
    const start = dayIndex() % imagedSites.length;
    const rotated = [...imagedSites.slice(start), ...imagedSites.slice(0, start)];
    return rotated.slice(0, Math.min(5, rotated.length));
  }, [imagedSites]);
  const heroSites = useLocalizedSites(heroSitesRaw);
  const heroSite = heroSites[0] ?? null;
  const heroDocent = heroSite ? getDocentScript(heroSite.id) : null;

  /**
   * 출발지를 정해 둔 사람에게는 "전국 아무 데나"가 아니라 **갈 수 있는 곳**을 먼저 보여준다.
   * 출발지가 없으면 지금까지처럼 기본 목록을 그대로 쓴다.
   */
  // allSites 가 이미 번역된 이름을 갖고 있어(위 useLocalizedSites), 여기서 다시 조회할 필요가 없다.
  const nearbyFirst = useMemo(() => {
    const from = gpsLocation ?? regionCoords(origin);
    if (!from || allSites.length === 0) return sites;

    return [...allSites]
      .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
      .map((s) => ({
        site: s,
        km: haversineKm(from.lat, from.lng, s.coordinates.lat!, s.coordinates.lng!),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 8)
      .map((x) => x.site);
  }, [origin, gpsLocation, allSites, sites]);

  return (
    <div className="bg-app-bg pb-10">
      {/*
        히어로 — 사진으로 시작한다.
        모바일: 오늘의 성지 다섯 곳을 좌우로 넘겨보는 캐러셀(2026-09-08) — 한 장만
        있는 줄 알았다는 피드백으로, 다음 카드가 오른쪽 끝에 살짝 걸치게 두고
        화살표로 더 있음을 알린다.
        데스크톱: 그중 첫 곳이 화면 폭을 꽉 채우고, 그 위에 서비스 한 줄 소개가 올라온다.
      */}
      {heroSite ? (
        <section className="pt-4 lg:px-0 lg:pt-0">
          {/* 모바일 전용 — 캐러셀 */}
          <div className="lg:hidden">
            <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1">
              {heroSites.map((site, i) => {
                const docent = getDocentScript(site.id);
                return (
                  <Link
                    key={site.id}
                    to={paths.siteDetail(site.id)}
                    className="relative h-80 w-[86%] shrink-0 snap-center overflow-hidden rounded-3xl"
                    id={i === 0 ? 'home-hero' : undefined}
                  >
                    <SiteThumbnail
                      imageUrl={site.imageUrl}
                      name={site.name}
                      category={site.category}
                      intensity="deep"
                      className="h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-0"
                      aria-hidden
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0) 65%)',
                      }}
                    />
                    {/* 옆에 더 있다는 것을 손으로 안 밀어봐도 알 수 있게 */}
                    {i > 0 && (
                      <div
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                        aria-hidden
                      >
                        <ChevronLeft size={20} />
                      </div>
                    )}
                    {i < heroSites.length - 1 && (
                      <div
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 animate-pulse items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-sm"
                        aria-hidden
                      >
                        <ChevronRight size={20} />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                      <p className="text-[0.6875rem] font-bold uppercase tracking-widest opacity-90">
                        {localizeRegionName(site.region, language)} · {localizeDomainValue(site.category, t)}
                      </p>
                      <h2 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight">
                        {site.name}
                      </h2>
                      {/* 도슨트 원고가 없는 성지에 있는 척하는 CTA 를 붙이지 않는다(더미 금지). */}
                      {docent && (
                        <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-[0.8125rem] font-semibold backdrop-blur-md">
                          <Headphones size={16} aria-hidden />
                          {t('heroDocentCta')}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 데스크톱 전용 — 오늘의 성지 한 곳을 크게 */}
          <div className="hidden lg:block">
          <div className="relative h-80 overflow-hidden rounded-3xl lg:h-[420px] lg:rounded-none">
            <SiteThumbnail
              imageUrl={heroSite.imageUrl}
              name={heroSite.name}
              category={heroSite.category}
              intensity="deep"
              className="h-full w-full object-cover"
            />
            {/* 모바일: 아래에서 위로. 데스크톱: 왼쪽에서 오른쪽으로 — 글이 왼쪽에 오므로 */}
            <div
              className="absolute inset-0 lg:hidden"
              aria-hidden
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,0) 65%)' }}
            />
            <div
              className="absolute inset-0 hidden lg:block"
              aria-hidden
              style={{
                background:
                  'linear-gradient(90deg, rgba(10,14,30,.85) 0%, rgba(10,14,30,.45) 55%, rgba(10,14,30,.12) 100%)',
              }}
            />

            {/* 데스크톱 전용 소개 문구 */}
            <div className="absolute inset-0 hidden items-center lg:flex">
              <PageContainer>
                <div className="max-w-[620px] text-white">
                  <p className="text-[0.6875rem] font-bold uppercase tracking-[.2em] text-[#c4b5fd]">
                    2026 관광데이터 활용 공모전 출품작
                  </p>
                  <h1 className="mt-4 text-[46px] font-extrabold leading-[1.12] tracking-tight">
                    붐비는 관광지 대신,
                    <br />
                    마음에 필요한 쉼표 하나.
                  </h1>
                  <p className="mt-4 text-base leading-relaxed opacity-90">
                    감정을 고르면 그에 맞는 성지와 도보권 관광지를 이어 붙인 쉼표 순례길을
                    제안합니다.
                    {allSites.length > 0 && ` 전국 성지 ${allSites.length}곳, 실시간 붐빔 정보와 함께.`}
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <Link
                      to={paths.compass}
                      className="rounded-full bg-white px-7 py-3.5 text-sm font-bold text-brand-blue"
                      id="hero-compass-cta"
                    >
                      {t('compassTitle')}
                    </Link>
                    <Link
                      to={paths.explore}
                      className="rounded-full border border-white/50 px-7 py-3.5 text-sm font-bold text-white"
                      id="hero-explore-cta"
                    >
                      {t('exploreAllTitle')}
                    </Link>
                  </div>
                </div>
              </PageContainer>
            </div>

            {/* 오늘의 성지 — 오른쪽 아래로 비켜 놓는다 */}
            <Link
              to={paths.siteDetail(heroSite.id)}
              className="absolute inset-x-auto bottom-8 right-10 block max-w-[280px] rounded-2xl bg-black/35 p-5 text-white backdrop-blur-md"
            >
              <p className="text-[0.6875rem] font-bold uppercase tracking-widest opacity-90">
                {localizeRegionName(heroSite.region, language)} · {localizeDomainValue(heroSite.category, t)}
              </p>
              <h2 className="mt-1 text-[20px] font-extrabold leading-tight tracking-tight">
                {heroSite.name}
              </h2>
              {/* 도슨트 원고가 없는 성지에 있는 척하는 CTA 를 붙이지 않는다(더미 금지). */}
              {heroDocent && (
                <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-[0.75rem] font-semibold backdrop-blur-md">
                  <Headphones size={16} aria-hidden />
                  {t('heroDocentCta')}
                </span>
              )}
            </Link>
          </div>
          </div>
        </section>
      ) : (
        <section className="px-6 pt-4 lg:px-0 lg:pt-0">
          <div className="h-80 animate-pulse rounded-3xl bg-gray-100 lg:h-[420px] lg:rounded-none" />
        </section>
      )}

      {/* 여기에서 가장 가까운 성지·성당 — 홈에서 바로 보이는 입구 (2026-09-12 사장님 요청).
          누르면 현재 위치를 묻고 208곳 전부를 가까운 순으로 보여준다. */}
      <PageContainer className="pt-6 lg:pt-10">
        <Link
          to={paths.nearby}
          id="nearby-entry"
          className="flex items-center gap-4 rounded-[28px] bg-brand-blue p-5 text-white shadow-lg shadow-brand-blue/20 transition-transform active:scale-[0.99] lg:p-6"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <MapPin size={24} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-extrabold leading-tight lg:text-xl">
              {t('nearbyEntryTitle')}
            </span>
            <span className="mt-1 block text-[0.75rem] font-medium text-white/80 lg:text-sm">
              {t('nearbyEntrySub')}
            </span>
          </span>
          <ChevronRight size={22} className="shrink-0 opacity-80" aria-hidden />
        </Link>
      </PageContainer>

      {/* 마음 나침반 — 앱의 본질 (2026-09-12 개편). 감정·출발지·시간을 물어 일정을 짜 준다.
          예전 「쉼표 순례길」 감정 칩과 바로가기 넷은 이 카드와 목적지가 겹쳐 뺐다. */}
      <PageContainer className="pt-4 lg:pt-6">
        <Link
          to={paths.compass}
          id="compass-entry"
          className="flex items-center gap-4 rounded-[28px] bg-gradient-to-br from-brand-blue to-brand-violet p-5 text-white shadow-lg shadow-brand-violet/20 transition-transform active:scale-[0.99] lg:p-6"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <Compass size={24} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-extrabold leading-tight lg:text-xl">
              {t('compassTitle')}
            </span>
            <span className="mt-1 block text-[0.75rem] font-medium text-white/85 lg:text-sm">
              {t('compassEntrySub')}
            </span>
          </span>
          <ChevronRight size={22} className="shrink-0 opacity-80" aria-hidden />
        </Link>
      </PageContainer>

      {/* 오늘의 쉼표 — 실시간 붐빔. 컨테이너가 좌우 여백을 대신 잡는다. */}
      <PageContainer className="pt-6">
        <div className="lg:max-w-[720px]">
          <TodayQuietSection sites={allSites} variant="compact" padded={false} />
        </div>
      </PageContainer>

      {/* 전국 성지 — 출발지가 있으면 가까운 곳부터 */}
      <PageContainer className="pt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <h3 className="text-lg font-bold text-app-text lg:text-2xl">
            {gpsLocation
              ? fillPlaceholders(t('nearbyRegionTitle'), { origin: t('useCurrentLocationButton') })
              : origin
                ? fillPlaceholders(t('nearbyRegionTitle'), { origin: localizeRegionName(origin, language) })
                : t('exploreAllTitle')}
          </h3>
          <Link to={paths.explore} className="shrink-0 text-[0.75rem] font-bold text-brand-violet">
            {t('explore')}
            <ChevronRight size={14} className="ml-0.5 inline" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {nearbyFirst.length > 0
            ? nearbyFirst.map((site) => <SiteGridCard key={site.id} site={site} />)
            : [1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square animate-pulse rounded-[20px] bg-gray-100" />
              ))}
        </div>
      </PageContainer>

    </div>
  );
}
