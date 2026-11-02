import { useMemo } from 'react';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';
import { usePublicPlaces } from '../hooks/use-places';
import { findEmotion } from '../lib/emotions';
import { isNearSite } from '../lib/near-site';

/**
 * 성지 상세 맨 아래 — 순례자들이 이 근처에서 새로 기록한 성당·장소 (2026-11-02 사장님 지시).
 * 관리자가 「공개」한 것만, 쓴 사람 이름 없이 보여 준다. 붙는 장소가 없으면 섹션째 그리지 않는다.
 */
export function NearbyPilgrimPlaces({ site }: { site: HolySite }) {
  const { t } = useSettings();
  const { data: places = [] } = usePublicPlaces();
  const near = useMemo(
    () =>
      places.filter((p) =>
        isNearSite(p, {
          lat: site.coordinates.lat,
          lng: site.coordinates.lng,
          location: site.location,
        }),
      ),
    [places, site.coordinates.lat, site.coordinates.lng, site.location],
  );

  if (near.length === 0) return null;

  return (
    <section aria-labelledby="pilgrim-places-heading">
      <SectionHeading as="h3" size="md" id="pilgrim-places-heading" title={t('placeNearbyTitle')} />
      <p className="-mt-2 mb-3 text-sm text-app-text-muted">{t('placeNearbySub')}</p>
      <ul className="space-y-3">
        {near.slice(0, 12).map((place) => {
          const emotion = findEmotion(place.emotion);
          return (
            <li
              key={place.id}
              className="overflow-hidden rounded-xl border border-app-border bg-white"
            >
              <img
                src={place.photoUrl}
                alt=""
                loading="lazy"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="space-y-1 px-4 py-3">
                <p className="text-lg font-bold text-app-text">{place.name}</p>
                {place.address && <p className="text-sm text-app-text-muted">{place.address}</p>}
                {emotion && (
                  <p className="text-base text-app-text">
                    <span aria-hidden>{emotion.emoji}</span> <strong>{t(emotion.labelKey)}</strong>
                    {place.emotionNote ? ` — ${place.emotionNote}` : ''}
                  </p>
                )}
                {place.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-app-text-muted">
                    {place.description}
                  </p>
                )}
                <p className="text-xs text-app-text-muted">{place.visitedOn}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
