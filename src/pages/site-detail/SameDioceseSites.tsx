import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { useLocalizedSites, useSitesInSameDiocese } from '@/features/sites/hooks/use-sites';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';

/** 「OO 교구의 다른 성지」 가로 목록 (#102 에서 페이지에서 떼어 냄) */
export function SameDioceseSites({ site }: { site: HolySite }) {
  const { language, t } = useSettings();
  const { data: nearbySitesRaw = [] } = useSitesInSameDiocese(site.region, site.id);
  const nearbySites = useLocalizedSites(nearbySitesRaw);

  if (nearbySites.length === 0) return null;
  return (
    <section>
      <SectionHeading
        title={fillPlaceholders(t('siteOtherInDiocese'), {
          diocese: localizeRegionName(site.region, language),
        })}
      />
      <div className="no-scrollbar -mx-3 flex gap-4 overflow-x-auto px-3 lg:-mx-5 lg:px-5">
        {nearbySites.map((nearby) => (
          <SquircleSurface
            as={Link}
            key={nearby.id}
            to={paths.siteDetail(nearby.id)}
            borderColor="var(--color-app-border)"
            borderClassName="transition-colors group-hover:stroke-brand-blue"
            className="group w-44 flex-shrink-0 overflow-hidden bg-white text-left"
            id={`nearby-${nearby.id}`}
          >
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-app-panel">
              <SiteThumbnail
                imageUrl={nearby.imageUrl}
                name={nearby.name}
                category={nearby.category}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="px-3 py-3">
              <h3 className="truncate text-base font-bold text-app-text">{nearby.name}</h3>
            </div>
          </SquircleSurface>
        ))}
      </div>
    </section>
  );
}
