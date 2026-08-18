import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Footprints } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { usePilgrimageRoutes } from '@/features/routes/hooks/use-pilgrimage-routes';

/**
 * 순례 코스 목록.
 *
 * 성지 208곳을 낱개로 나열하는 대신, 박해 사건·인물의 이야기 순서로 꿴 코스를 보여준다.
 * 산티아고 가이드(Gronze)가 길을 "하루 구간"으로 나누듯, 우리는 "이야기 구간"으로 나눈다.
 */
export default function RoutesPage() {
  const navigate = useNavigate();
  const { data: routes = [], isLoading } = usePilgrimageRoutes();

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white pb-16">
      <header className="p-8 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-1 text-sm font-bold text-app-text-muted"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={18} /> 뒤로
        </button>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-app-text">순례 코스</h1>
        <p className="text-sm font-medium text-app-text-muted">
          박해의 역사와 인물을 따라, 성지를 이야기 순서로 걷는다
        </p>
      </header>

      <div className="flex flex-col gap-4 px-8 py-4">
        {isLoading && <LoadingSpinner label="코스를 불러오는 중" />}
        {routes.map((route) => (
          <Link
            key={route.id}
            to={paths.routeDetail(route.slug)}
            className="group rounded-[20px] border border-gray-100 bg-app-bg p-6 transition-all hover:border-brand-violet hover:bg-[#F3F0FF]"
          >
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-app-text-muted">
              <Footprints size={14} aria-hidden />
              {route.stopCount != null && <span>{route.stopCount}곳 경유</span>}
            </div>
            <h2 className="mb-1 text-xl font-extrabold text-app-text group-hover:text-brand-violet">
              {route.title}
            </h2>
            {route.subtitle && (
              <p className="mb-3 text-sm font-medium text-app-text-muted">{route.subtitle}</p>
            )}
            {route.description && (
              <p className="line-clamp-2 text-sm leading-relaxed text-app-text-muted">
                {route.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-1 text-sm font-bold text-brand-violet">
              코스 보기 <ChevronRight size={16} aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
