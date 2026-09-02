import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Footprints, MapPin } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { usePilgrimageRoute } from '@/features/routes/hooks/use-pilgrimage-routes';
import { useFeaturedPhotos } from '@/features/sites/hooks/use-featured-photos';

/**
 * 코스 상세 — 경유지를 이야기 순서대로 보여준다.
 *
 * Gronze 의 구간 페이지처럼 순서가 핵심이다. 번호와 세로선으로 "몇 번째 자리"인지
 * 드러내고, 각 경유지에는 이 코스에서의 의미(note) 한 줄을 붙인다.
 */
export default function RouteDetailPage() {
  // 공식 사진이 없는 성지는 순례자가 보내준(승인된) 사진으로 채운다
  const { data: featured = {} } = useFeaturedPhotos();
  const { routeSlug = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = usePilgrimageRoute(routeSlug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingSpinner label="코스를 불러오는 중" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto min-h-screen max-w-2xl bg-white p-8">
        <EmptyState icon={Footprints} title="코스를 찾을 수 없어요" description="주소를 다시 확인해 주세요." />
      </div>
    );
  }

  const { route, stops } = data;

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white pb-16">
      <header className="p-8 pb-2">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm font-bold text-app-text-muted"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={18} /> 뒤로
        </button>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-app-text">{route.title}</h1>
        {route.subtitle && (
          <p className="mb-4 text-sm font-bold text-brand-violet">{route.subtitle}</p>
        )}
        {route.description && (
          <p className="text-[15px] leading-relaxed text-app-text-muted">{route.description}</p>
        )}
      </header>

      <ol className="px-8 py-6">
        {stops.map((stop, i) => (
          <li key={stop.position} className="relative flex gap-4 pb-8 last:pb-0">
            {/* 세로 연결선 — 마지막 경유지에는 그리지 않는다 */}
            {i < stops.length - 1 && (
              <span
                className="absolute left-[15px] top-10 h-full w-px bg-gray-200"
                aria-hidden
              />
            )}
            <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-violet text-sm font-extrabold text-white">
              {stop.position}
            </span>
            <Link
              to={paths.siteDetail(stop.site.id)}
              className="group flex-1 overflow-hidden rounded-[16px] border border-gray-100 bg-app-bg transition-all hover:border-brand-violet"
            >
              <div className="relative flex h-36 items-center justify-center overflow-hidden bg-white">
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
                <h2 className="mb-1 text-lg font-extrabold text-app-text group-hover:text-brand-violet">
                  {stop.site.name}
                </h2>
                {stop.note && (
                  <p className="mb-2 text-sm font-medium text-brand-violet">{stop.note}</p>
                )}
                <p className="flex items-center gap-1 text-xs text-app-text-muted">
                  <MapPin size={12} aria-hidden /> {stop.site.location}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
