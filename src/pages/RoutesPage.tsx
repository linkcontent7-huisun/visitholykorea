import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink, Footprints, MapPin } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { dioceseLabel } from '@/shared/i18n/domain-labels';
import { NATIONWIDE_TRAILS } from '@/features/routes/lib/official-trails';
import { useSettings } from '@/shared/i18n/use-settings';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import {
  usePilgrimageRoutes,
  useLocalizedRoutes,
} from '@/features/routes/hooks/use-pilgrimage-routes';

/**
 * 순례 코스 목록.
 *
 * 성지 208곳을 낱개로 나열하는 대신, 박해 사건·인물의 이야기 순서로 꿴 코스를 보여준다.
 * 산티아고 가이드(Gronze)가 길을 "하루 구간"으로 나누듯, 우리는 "이야기 구간"으로 나눈다.
 */
export default function RoutesPage() {
  const { t, language } = useSettings();
  const { data: routesRaw = [], isLoading } = usePilgrimageRoutes();
  const routes = useLocalizedRoutes(routesRaw);

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

      {/* 전국 교구 순례길 — 앱 밖 공식 누리집으로 잇는다 (T-050) */}
      <section className="mt-12" aria-labelledby="nationwide-trails">
        <h2 id="nationwide-trails" className="mb-1 text-xl font-bold text-app-text">
          {t('nationwideTrailsTitle')}
        </h2>
        <p className="mb-4 text-base text-app-text-muted">{t('nationwideTrailsSub')}</p>
        <ul className="flex flex-col gap-3">
          {NATIONWIDE_TRAILS.map((trail) => (
            <li key={trail.url}>
              <a
                href={trail.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-lg border border-app-border bg-white p-4 transition-colors hover:border-brand-blue"
              >
                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-sm font-bold text-brand-blue">
                    {dioceseLabel(trail.diocese, language)}
                  </p>
                  <p className="text-lg font-bold text-app-text group-hover:text-brand-blue">
                    {language === 'ko' ? trail.name : trail.nameEn}
                  </p>
                  {language === 'ko' && (
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-app-text-muted">
                      <MapPin size={14} aria-hidden /> {trail.region} · {trail.owner}
                    </p>
                  )}
                </div>
                <ExternalLink size={18} className="shrink-0 text-brand-blue" aria-hidden />
                <span className="sr-only">{t('routeOfficialSite')}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </PageContainer>
  );
}
