import { Link, useParams } from 'react-router-dom';
import { Check, Footprints, MapPin } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { usePilgrimageRoute } from '@/features/routes/hooks/use-pilgrimage-routes';
import { countVisitedEpisodes, toEpisodes } from '@/features/routes/lib/episodes';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { useFeaturedPhotos } from '@/features/sites/hooks/use-featured-photos';
import { useWalkingCoursesNear } from '@/features/sites/hooks/use-tour-extras';
import { WalkingCourseCard } from '@/features/sites/components/WalkingCourseCard';

/**
 * 코스 상세 — 경유지를 이야기 순서대로 보여준다.
 *
 * Gronze 의 구간 페이지처럼 순서가 핵심이다. 번호와 세로선으로 "몇 번째 자리"인지
 * 드러내고, 각 경유지에는 이 코스에서의 의미(note) 한 줄을 붙인다.
 */
export default function RouteDetailPage() {
  const { t } = useSettings();
  // 공식 사진이 없는 성지는 순례자가 보내준(승인된) 사진으로 채운다
  const { data: featured = {} } = useFeaturedPhotos();
  const { routeSlug = '' } = useParams();
  const { data, isLoading } = usePilgrimageRoute(routeSlug);
  const { data: walkingCourses = [] } = useWalkingCoursesNear(data?.stops[0]?.site);
  // 이 코스 중 몇 화에 후기를 남겼는지 — 스탬프는 후기를 쓸 때만 찍힌다(2026-09-17,
  // "순례 스탬프 찍기" 버튼 삭제 이후 후기 제출이 스탬프의 유일한 입구다).
  const { data: myStamps = [] } = useMyStamps();

  if (isLoading) {
    return (
      <div className="flex min-h-page items-center justify-center">
        <LoadingSpinner label={t('routeLoading')} />
      </div>
    );
  }

  if (!data) {
    return (
      <PageContainer width="narrow" className="min-h-page">
        <PageHeader back title={t('routesTitle')} />
        <EmptyState
          icon={Footprints}
          title={t('routeNotFoundTitle')}
          description={t('routeNotFoundBody')}
        />
      </PageContainer>
    );
  }

  const { route, stops } = data;
  const episodes = toEpisodes(stops);
  const visitedIds = new Set(myStamps.map((s) => s.siteId));
  const visitedCount = countVisitedEpisodes(stops, visitedIds);

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title={route.title} sub={route.subtitle} />
      {route.description && (
        <p className="text-base leading-relaxed text-app-text-muted">{route.description}</p>
      )}

      {/* 연재 진행도 — "몇 화에 후기를 남겼는가"다(방문 여부가 아니다, 사장님 확인 2026-09-18) */}
      <div className="mt-5 rounded-lg border border-app-border bg-white p-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span className="text-app-text">
            {fillPlaceholders(t('routeTotalEpisodes'), { count: stops.length })} ·{' '}
            {visitedCount > 0
              ? fillPlaceholders(t('routeVisitedUpTo'), { count: visitedCount })
              : t('routeNotStarted')}
          </span>
          <span className="tabular-nums text-app-text-muted">
            {visitedCount} / {stops.length}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-app-panel">
          <div
            className="h-full rounded-full bg-brand-blue transition-[width] duration-500"
            style={{ width: `${stops.length > 0 ? (visitedCount / stops.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      <ol className="py-6">
        {stops.map((stop, i) => {
          const ep = episodes[i]!;
          const visited = visitedIds.has(stop.site.id);
          return (
            <li key={stop.position} className="relative flex gap-4 pb-8 last:pb-0">
              {/* 세로 연결선 — 마지막 경유지에는 그리지 않는다 */}
              {i < stops.length - 1 && (
                <span
                  className="absolute left-[15px] top-10 h-full w-px bg-app-border"
                  aria-hidden
                />
              )}
              <span
                className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${
                  visited ? 'bg-emerald-600' : 'bg-brand-blue'
                }`}
                aria-label={fillPlaceholders(t(visited ? 'routeEpisodeVisited' : 'routeEpisode'), {
                  n: ep.episode,
                })}
              >
                {visited ? <Check size={16} aria-hidden /> : ep.episode}
              </span>
              <div className="flex-1">
                <Link
                  to={paths.siteDetail(stop.site.id)}
                  className="group block overflow-hidden rounded-lg border border-app-border bg-white transition-colors hover:border-brand-blue"
                >
                  <div className="relative flex h-36 items-center justify-center overflow-hidden bg-app-panel">
                    <SiteThumbnail
                      imageUrl={stop.site.imageUrl}
                      pilgrimUrl={featured[stop.site.id] ?? null}
                      name={stop.site.name}
                      category={stop.site.category}
                      emojiSizeClass="text-5xl"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <p className="mb-1 text-xs font-bold text-brand-blue">
                      {fillPlaceholders(t(ep.isFinale ? 'routeEpisodeFinale' : 'routeEpisode'), {
                        n: ep.episode,
                      })}
                    </p>
                    <h2 className="mb-1 text-lg font-bold text-app-text group-hover:text-brand-blue">
                      {stop.site.name}
                    </h2>
                    {stop.note && (
                      <p className="mb-2 text-sm font-medium text-brand-blue">{stop.note}</p>
                    )}
                    <p className="flex items-center gap-1 text-sm text-app-text-muted">
                      <MapPin size={14} aria-hidden /> {stop.site.location}
                    </p>
                  </div>
                </Link>

                {/* 다음 화 예고 — 연재물이 다음 편을 보게 만드는 장치.
                  예고 문구는 다음 경유지의 note 를 그대로 쓴다(없는 사연을 짓지 않는다). */}
                {ep.next && (
                  <p className="mt-3 border-l-2 border-brand-blue/30 pl-3 text-sm leading-relaxed text-app-text-muted">
                    <span className="font-bold text-brand-blue">
                      {fillPlaceholders(t('routeNextEpisode'), {
                        n: ep.episode + 1,
                        name: ep.next.siteName,
                      })}
                    </span>
                    {ep.next.teaser && <span className="block mt-0.5">{ep.next.teaser}</span>}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {walkingCourses.length > 0 && (
        <section className="pb-8">
          <SectionHeading title={t('routeNearbyTrails')} />
          <div className="space-y-3">
            {walkingCourses.slice(0, 3).map((course, index) => (
              <WalkingCourseCard key={course.crsIdx ?? index} course={course} />
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
