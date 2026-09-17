/**
 * 성지 주변 본당·공소·피정의집.
 *
 * 로드맵 3단계 "catholic_directory 활용". 교구 주소록 5,918건 중 좌표가
 * 있는 곳을 반경 5km 에서 찾아 보여준다. 미사 시간은 본당마다 수시로
 * 바뀌므로 적지 않는다 — 전화로 확인하게 안내하는 것이 정직하다.
 */

import type { HolySite } from '@/shared/types/domain';
import { useSettings } from '@/shared/i18n/use-settings';
import { Card } from '@/shared/components/ui/Card';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { DirectoryEntryCard } from './DirectoryEntryCard';
import { useNearbyDirectory } from '../hooks/use-nearby-directory';

/** 구글·애플은 한국 사용자에게는 거의 안 쓰여 뺀다(사장님 지적, 2026-09-17) — 카카오·티맵·네이버만 */
const PARISH_MAP_PROVIDERS = ['kakao', 'tmap', 'naver'] as const;

export function NearbyParishesCard({ site }: { site: HolySite }) {
  const { t, language } = useSettings();
  const { data: places = [], isLoading } = useNearbyDirectory(site.coordinates);

  // 좌표가 없거나 주변에 아무것도 없으면 카드 자체를 내리지 않는다 — 빈 껍데기 금지
  if (isLoading || places.length === 0) return null;

  return (
    <section>
      <SectionHeading as="h3" size="md" title={t('regionParishesTitle')} />
      <Card>
        <ul className="divide-y divide-app-border">
          {places.map((p) => (
            <li key={p.id} className="py-3 first:pt-0 last:pb-0">
              <DirectoryEntryCard
                entry={p}
                bare
                hideDistance
                mapProviders={PARISH_MAP_PROVIDERS}
              />
            </li>
          ))}
        </ul>

        {language !== 'ko' && places.some((p) => p.nameRomanized) && (
          <p className="mt-4 text-sm italic leading-relaxed text-app-text-muted">
            {t('directoryRomanizedNote')}
          </p>
        )}
        <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
          {t('nearbyParishesMassTimesNote')}
        </p>
      </Card>
    </section>
  );
}
