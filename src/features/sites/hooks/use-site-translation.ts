import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { useSettings } from '@/shared/i18n/use-settings';
import { fetchSiteTranslation } from '../api/holy-sites.repository';
import { applyTranslation, type TranslatedSiteView } from '../lib/translated-site';
import type { HolySite } from '@/shared/types/domain';

/**
 * 언어 설정에 따라 성지 본문을 번역본으로 겹친 화면용 뷰.
 * 한국어 모드거나 번역이 없으면 원문이 그대로 나온다.
 */
export function useTranslatedSite(site: HolySite | undefined): TranslatedSiteView | null {
  const { language } = useSettings();

  const { data: translation = null } = useQuery({
    queryKey: queryKeys.sites.translation(site?.id ?? '', language),
    queryFn: () => fetchSiteTranslation(site!.id, language),
    enabled: Boolean(site) && language !== 'ko',
    staleTime: 1000 * 60 * 60,
  });

  if (!site) return null;
  return applyTranslation(site, language === 'ko' ? null : translation);
}
