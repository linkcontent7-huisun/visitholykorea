import { Link } from 'react-router-dom';
import { ChevronRight, Footprints } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { usePilgrimageRoutes } from '@/features/routes/hooks/use-pilgrimage-routes';

/**
 * 순례 코스 목록.
 *
 * 성지 208곳을 낱개로 나열하는 대신, 박해 사건·인물의 이야기 순서로 꿴 코스를 보여준다.
 * 산티아고 가이드(Gronze)가 길을 "하루 구간"으로 나누듯, 우리는 "이야기 구간"으로 나눈다.
 */
export default function RoutesPage() {
  const { t } = useSettings();
  const { data: routes = [], isLoading } = usePilgrimageRoutes();

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title={t('routesTitle')} sub={t('routesSubtitle')} />

      <div className="flex flex-col gap-3">
        {isLoading && <LoadingSpinner label={t('routeLoading')} />}
        {routes.map((route) => (
          <Link
            key={route.id}
            to={paths.routeDetail(route.slug)}
            className="group rounded-lg border border-app-border bg-white p-5 transition-colors hover:border-brand-blue"
          >
            <div className="mb-1 flex items-center gap-2 text-sm font-bold text-app-text-muted">
              <Footprints size={14} aria-hidden />
              {route.stopCount != null && (
                <span>{fillPlaceholders(t('routeStopsCount'), { count: route.stopCount })}</span>
              )}
            </div>
            <h2 className="mb-1 text-xl font-bold text-app-text group-hover:text-brand-blue">
              {route.title}
            </h2>
            {route.subtitle && (
              <p className="mb-3 text-base text-app-text-muted">{route.subtitle}</p>
            )}
            {route.description && (
              <p className="line-clamp-2 text-base leading-relaxed text-app-text-muted">
                {route.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-1 text-base font-bold text-brand-blue">
              {t('routeViewCourse')} <ChevronRight size={16} aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
