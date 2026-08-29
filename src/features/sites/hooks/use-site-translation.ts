import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/query-keys';
import { FALLBACK_CHAIN } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { fetchSiteTranslations } from '../api/holy-sites.repository';
import { applyTranslation, resolveTranslation, type TranslatedSiteView } from '../lib/translated-site';
import type { HolySite } from '@/shared/types/domain';

/**
 * 언어 설정에 따라 성지 본문을 번역본으로 겹친 화면용 뷰.
 *
 * 요청 언어에 번역이 없으면 **영어로 한 단계 내려간 뒤** 한국어 원문으로 간다
 * (`FALLBACK_CHAIN`). 스페인어 순례자에게 한국어를 보여주는 것은 답이 아니고,
 * 영어는 208곳 전부 갖춰져 있어 최소한 읽을 수는 있다.
 */
export function useTranslatedSite(site: HolySite | undefined): TranslatedSiteView | null {
  const { language } = useSettings();

  // 한국어 모드면 조회 자체가 필요 없다. 그 밖에는 요청 언어 + 폴백 언어를 함께 받는다.
  const wanted = language === 'ko' ? [] : [language, ...FALLBACK_CHAIN[language]].filter((l) => l !== 'ko');

  const { data: byLanguage = {} } = useQuery({
    queryKey: queryKeys.sites.translation(site?.id ?? '', wanted.join('+')),
    queryFn: () => fetchSiteTranslations(site!.id, wanted),
    enabled: Boolean(site) && wanted.length > 0,
    staleTime: 1000 * 60 * 60,
  });

  if (!site) return null;
  return applyTranslation(site, resolveTranslation(byLanguage, language));
}
