import { useQuery } from '@tanstack/react-query';
import { getAudioStoriesNearby, getWalkingCoursesNear } from '@/shared/api/tour-api';
import { districtOfAddress, regionOfAddress } from '@/shared/lib/regions';
import { queryKeys } from '@/shared/api/query-keys';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';


/** 관광지 오디오 이야기는 지원 언어가 넷뿐이라 그 밖의 앱 언어는 영어로 안내한다. */
function odiiLanguage(language: string): 'ko' | 'en' | 'ja' | 'zh' {
  return language === 'ko' ? 'ko' : 'en';
}

export function useAudioStoriesNearby(site: HolySite | undefined) {
  const { language } = useSettings();
  const lat = site?.coordinates.lat ?? null;
  const lng = site?.coordinates.lng ?? null;
  const langCode = odiiLanguage(language);
  return useQuery({
    queryKey: queryKeys.tour.audioStories(lat ?? 0, lng ?? 0, langCode),
    queryFn: () => getAudioStoriesNearby(lng!, lat!, langCode),
    enabled: lat != null && lng != null,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 0,
  });
}

/** 두루누비는 좌표 검색이 없어 주소의 시·도 + 시·군·구로 좁힌다 (예: 충남 서산시). */
export function useWalkingCoursesNear(site: HolySite | undefined) {
  const region = regionOfAddress(site?.location ?? '');
  const district = districtOfAddress(site?.location ?? '');
  return useQuery({
    queryKey: queryKeys.tour.walkingCourses(`${region ?? ''} ${district ?? ''}`),
    queryFn: () => getWalkingCoursesNear(region!, district!),
    enabled: Boolean(region && district),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 0,
  });
}
