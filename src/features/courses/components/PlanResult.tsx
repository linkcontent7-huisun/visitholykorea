import { ChevronLeft, ExternalLink, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { haversineKm, kakaoPlaceUrl } from '@/shared/lib/geo';
import { Button } from '@/shared/components/ui/Button';
import type { TimeBudget } from '../api/course-matching';
import type { Candidate } from '../hooks/use-candidate-plans';
import { formatFromOrigin, formatFromSite } from '../lib/plan-format';

/**
 * 일정 화면 — 카드를 누르면. 성지 1곳 중심 하루 일정: 오전 성지 → 점심 → 오후 관광지.
 * 데이터는 카드 화면에서 이미 받아 둔 것(Candidate)을 그대로 쓴다 — 여기서 TourAPI 추가 호출 0.
 *
 * 붐빔(혼잡도·집중률)은 보이지 않는다 — 공모전이 끝나 붐빔 지수를 재지도 보이지도 않기로 함(사장님 2026-11-27).
 * 오후 관광지는 성지에서 가까운 순이다.
 */

function spotDistanceKm(candidate: Candidate, spot: TourApiSpot): number | null {
  const { lat, lng } = candidate.site.coordinates;
  const d = Number(spot.dist);
  if (Number.isFinite(d) && d > 0) return d / 1000;
  if (lat == null || lng == null) return null;
  return haversineKm(lat, lng, Number(spot.mapy), Number(spot.mapx));
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-12 shrink-0 text-sm font-bold text-app-text-muted">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

function SpotLink({
  candidate,
  spot,
  t,
}: {
  candidate: Candidate;
  spot: TourApiSpot;
  t: (k: TranslationKey) => string;
}) {
  const km = spotDistanceKm(candidate, spot);
  return (
    <a
      href={kakaoPlaceUrl(spot.title, Number(spot.mapy), Number(spot.mapx))}
      target="_blank"
      rel="noreferrer noopener"
      className="group block"
      aria-label={fillPlaceholders(t('viewOnKakaoMap'), { title: spot.title })}
    >
      <p className="flex items-center gap-1 text-base font-bold text-app-text group-hover:text-brand-blue">
        <span>{spot.title}</span>
        <ExternalLink size={14} className="shrink-0 text-app-text-muted" aria-hidden />
      </p>
      {km != null && (
        <p className="flex items-center gap-1 text-sm text-app-text-muted">
          <MapPin size={14} className="shrink-0" aria-hidden />
          {formatFromSite(km, t)}
        </p>
      )}
    </a>
  );
}

interface PlanResultProps {
  candidate: Candidate;
  timeBudget: TimeBudget;
  onBack: () => void;
  onGo: () => void;
}

export function PlanResult({ candidate, timeBudget, onBack, onGo }: PlanResultProps) {
  const { t } = useSettings();
  const { site, lunch, afternoon, facilities, loading } = candidate;
  // 오후는 가까운 순 첫째 — 붐빔으로 고르던 「바꾸기」는 붐빔 지수와 함께 뺐다(2026-11-27)
  const pick = afternoon[0] ?? null;
  const showLunch = timeBudget !== '반나절';

  const nearbyFailed = facilities == null && !loading;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mb-4 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-base font-bold text-brand-blue transition-colors hover:bg-app-bg"
        id="plan-back"
      >
        <ChevronLeft size={20} aria-hidden />
        {t('planBackToCards')}
      </button>

      <div className="mb-5 overflow-hidden rounded-lg border border-app-border bg-white">
        <button type="button" onClick={onGo} className="block w-full text-left" id="plan-site">
          <div className="h-44 overflow-hidden bg-app-panel">
            <SiteThumbnail
              imageUrl={site.imageUrl}
              name={site.name}
              category={site.category}
              className="h-full w-full object-cover"
            />
          </div>
        </button>
        <ol className="space-y-4 p-5" aria-live="polite">
          <Row label={t('planMorning')}>
            <button type="button" onClick={onGo} className="block text-left">
              <p className="text-lg font-bold leading-tight text-app-text">{site.name}</p>
              <p className="mt-0.5 text-sm text-app-text-muted">
                {site.location ? `${site.location} · ` : ''}
                {formatFromOrigin(candidate.distanceKm, t)}
              </p>
            </button>
          </Row>

          {showLunch && (
            <Row label={t('planLunch')}>
              {lunch ? (
                <SpotLink candidate={candidate} spot={lunch} t={t} />
              ) : (
                <p className="text-base text-app-text-muted">
                  {loading
                    ? t('planLoadingNearby')
                    : nearbyFailed
                      ? t('planNearbyFailed')
                      : t('planNoLunch')}
                </p>
              )}
            </Row>
          )}

          <Row label={t('planAfternoon')}>
            {pick ? (
              <>
                <SpotLink candidate={candidate} spot={pick.spot} t={t} />
              </>
            ) : (
              <p className="text-base text-app-text-muted">
                {loading
                  ? t('planLoadingNearby')
                  : nearbyFailed
                    ? t('planNearbyFailed')
                    : t('planNoAfternoon')}
              </p>
            )}
          </Row>

          {timeBudget === '1박2일' && (
            <li
              className="rounded-lg bg-app-panel p-3 text-sm font-bold text-app-text-muted"
              id="plan-day2"
            >
              {t('planDay2Pending')}
            </li>
          )}
        </ol>
        <p className="border-t border-app-border px-5 py-2 text-xs font-bold text-app-text-muted">
          {t('compassRealtimeSource')}
        </p>
      </div>

      <Button block onClick={onGo} className="min-h-14 text-lg" id="quiz-go">
        {t('planGoWithThis')}
      </Button>
    </div>
  );
}
