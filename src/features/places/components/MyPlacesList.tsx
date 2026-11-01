import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/shared/i18n/use-settings';
import type { UserPlace } from '../api/places.repository';
import { useDeletePlace, useMyPlaces } from '../hooks/use-places';
import { findEmotion } from '../lib/emotions';

/** 기록 화면의 「내가 기록한 장소」 — 성지 스탬프와 따로 모은다. */
export function MyPlacesList() {
  const { t } = useSettings();
  const { data: places = [] } = useMyPlaces();
  if (places.length === 0) return null;

  return (
    <section className="mb-6" aria-labelledby="my-places-heading">
      <h2 id="my-places-heading" className="mb-3 text-base font-extrabold text-app-text">
        {t('placeMineTitle')}
      </h2>
      <ul className="space-y-3">
        {places.map((place) => (
          <PlaceItem key={place.id} place={place} />
        ))}
      </ul>
    </section>
  );
}

function PlaceItem({ place }: { place: UserPlace }) {
  const { t } = useSettings();
  const remove = useDeletePlace();
  const [confirming, setConfirming] = useState(false);
  const emotion = findEmotion(place.emotion);
  const status = {
    pending: { key: 'placeStatusPending', cls: 'bg-amber-100 text-amber-800' },
    approved: { key: 'placeStatusApproved', cls: 'bg-green-100 text-green-800' },
    rejected: { key: 'placeStatusRejected', cls: 'bg-slate-100 text-slate-600' },
  } as const;
  const badge = status[place.status];

  return (
    <li className="overflow-hidden rounded-xl border border-app-border bg-white">
      <img
        src={place.photoUrl}
        alt=""
        loading="lazy"
        className="aspect-[4/3] w-full object-cover"
      />
      <div className="space-y-1.5 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-bold text-app-text">{place.name}</p>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${badge.cls}`}>
            {t(badge.key)}
          </span>
        </div>
        <p className="text-sm text-app-text-muted">
          {place.visitedOn}
          {place.address ? ` · ${place.address}` : ''}
        </p>
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
        <div className="pt-1 text-right">
          {confirming ? (
            <span className="inline-flex gap-2">
              <button
                type="button"
                onClick={() => remove.mutate(place)}
                disabled={remove.isPending}
                className="min-h-11 rounded-lg bg-red-700 px-3 text-sm font-bold text-white"
              >
                {t('placeDeleteConfirm')}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="min-h-11 rounded-lg border border-app-border px-3 text-sm font-bold"
              >
                {t('cancel')}
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-app-text-muted"
            >
              <Trash2 size={16} aria-hidden />
              {t('placeDelete')}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
