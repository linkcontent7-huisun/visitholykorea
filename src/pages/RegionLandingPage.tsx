import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { SiteListItem } from '@/features/sites/components/SiteListItem';
import { useSites } from '@/features/sites/hooks/use-sites';
import { useSettings } from '@/shared/i18n/use-settings';
import { haversineKm } from '@/shared/lib/geo';
import { isRegion, regionCoords, REGIONS } from '@/shared/lib/regions';

/** 이 반경 안이면 "그 도시에서 다녀올 수 있는 거리"로 본다. */
const RADIUS_KM = 45;

/**
 * 시·도 랜딩 — `/region/대전` 처럼 지역 이름을 붙여 들어오는 화면.
 *
 * **왜 만들었나** — 지자체·지역 관광기관에 서비스를 소개할 때 건네줄 링크가 필요했다.
 * 다만 한 지역만 특별대우하면 전국 서비스의 구조가 망가지고, 다른 지역 심사에서는
 * 오히려 감점이 된다. 그래서 **17개 시·도 전부에 같은 방식으로 작동하는 한 화면**으로
 * 만들고, 대전에 건네는 링크는 그중 하나가 되게 했다.
 *
 * **지어낸 내용이 없다.** 화면에 나오는 것은 DB 의 성지 정보와, 시·도 중심 좌표에서
 * 계산한 직선거리뿐이다. 없는 순례 코스를 만들어 넣지 않는다.
 */
export default function RegionLandingPage() {
  const navigate = useNavigate();
  const { region: raw } = useParams<{ region: string }>();
  const { origin, setOrigin } = useSettings();
  const region = isRegion(raw) ? raw : null;

  const { data: allSites = [], isLoading } = useSites({ limit: 300 });

  // 이 링크로 들어온 사람은 그 지역에서 출발한다고 보는 게 자연스럽다.
  // 앱 전체(홈·퀴즈)가 같은 출발지를 쓰므로, 여기서 한 번 맞춰두면 이후 화면이 이어진다.
  useEffect(() => {
    if (region && origin !== region) setOrigin(region);
  }, [region, origin, setOrigin]);

  const nearby = useMemo(() => {
    const from = regionCoords(region);
    if (!from) return [];
    return allSites
      .filter((s) => s.coordinates.lat != null && s.coordinates.lng != null)
      .map((s) => ({
        site: s,
        km: haversineKm(from.lat, from.lng, s.coordinates.lat!, s.coordinates.lng!),
      }))
      .filter((x) => x.km <= RADIUS_KM)
      .sort((a, b) => a.km - b.km);
  }, [allSites, region]);

  if (!region) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-white p-8">
        <h1 className="mb-3 text-2xl font-extrabold text-app-text">지역을 찾을 수 없어요</h1>
        <p className="mb-6 text-sm font-medium text-app-text-muted">
          주소의 지역 이름을 확인해 주세요.
        </p>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Link
              key={r}
              to={paths.region(r)}
              className="rounded-full border border-app-border bg-app-bg px-4 py-2 text-sm font-bold text-app-text"
            >
              {r}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white pb-16">
      <header className="p-8 pb-4">
        <button
          onClick={() => navigate(paths.home)}
          className="mb-6 flex items-center gap-1 text-sm font-bold text-app-text-muted"
          aria-label="홈으로"
        >
          <ArrowLeft size={18} /> 홈으로
        </button>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-violet">
          Visit Holy Korea
        </p>
        <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-app-text">
          {region}에서 떠나는
          <br />
          성지 순례
        </h1>
        <p className="text-sm font-medium leading-relaxed text-app-text-muted">
          {region} 중심에서 <strong className="text-app-text">{RADIUS_KM}km</strong> 안에 있는
          천주교 성지를 가까운 순으로 모았어요
        </p>
      </header>

      <div className="px-8 py-4">
        {isLoading && <LoadingSpinner label="성지를 불러오는 중" />}

        {!isLoading && (
          <>
            <div className="mb-6 flex items-center gap-4 rounded-[20px] bg-app-bg p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-violet/10 text-brand-violet">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-app-text">{nearby.length}곳</p>
                <p className="text-[12px] font-medium text-app-text-muted">
                  {region}에서 {RADIUS_KM}km 안 · 전국 {allSites.length}곳 중
                </p>
              </div>
            </div>

            {nearby.length === 0 ? (
              <p className="rounded-[20px] bg-app-bg p-6 text-center text-sm font-medium text-app-text-muted">
                {region} 반경 {RADIUS_KM}km 안에는 아직 등록된 성지가 없어요.
                <br />
                지도에서 전국 성지를 둘러보세요.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {nearby.map(({ site, km }) => (
                  <li key={site.id} className="relative">
                    <SiteListItem site={site} />
                    <span className="pointer-events-none absolute right-5 top-5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-app-text-muted">
                      {km < 10 ? km.toFixed(1) : Math.round(km)}km
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-6 text-[11px] leading-relaxed text-app-text-muted opacity-70">
              거리는 {region} 중심 좌표 기준 직선거리입니다. 실제 이동 거리·시간과는 다릅니다.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                to={paths.home}
                className="rounded-[20px] bg-brand-violet px-6 py-4 text-center text-sm font-bold text-white"
              >
                {region}을 출발지로 앱 시작하기
              </Link>
              <Link
                to={paths.map}
                className="rounded-[20px] border border-app-border px-6 py-4 text-center text-sm font-bold text-app-text"
              >
                지도에서 전국 성지 보기
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
