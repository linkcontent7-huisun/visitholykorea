import { ChevronLeft, ExternalLink, MapPin, AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import type { TourApiSpot } from '@/shared/api/tour-api';
import { fillPlaceholders, type TranslationKey } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { haversineKm, kakaoPlaceUrl } from '@/shared/lib/geo';
import type { CrowdingScore } from '@/features/quiet/api/crowding-score';
import type { TimeBudget } from '../api/course-matching';
import type { Candidate } from '../hooks/use-candidate-plans';
import type { CongestionLevel } from '../lib/afternoon-pick';
import { formatFromOrigin, formatFromSite } from '../lib/plan-format';

/**
 * 일정 화면 — 카드를 누르면. 성지 1곳 중심 하루 일정: 오전 성지 → 점심 → 오후 관광지.
 * 데이터는 카드 화면에서 이미 받아 둔 것(Candidate)을 그대로 쓴다 — 여기서 TourAPI 추가 호출 0.
 *
 * 붐빔은 두 자리에서, 역할이 다르다(스펙 8절):
 *   오전 줄 — 성지 **인근 지역**의 붐빔 추정(A-2 와 같은 산식). 성지가 조용하다고는 말하지 않는다.
 *   오후 줄 — 관광지의 관광공사 집중률. 붐빌 예정이면 한 줄 더 알리고 「바꾸기」.
 */

const NEARBY_KEY: Record<CrowdingScore['level'], TranslationKey> = {
  '아주 조용': 'nearbyQuiet',
  조용: 'nearbyQuiet',
  보통: 'nearbyModerate',
  붐빔: 'nearbyCrowded',
  '매우 붐빔': 'nearbyCrowded',
};

const CONGESTION_KEY: Record<CongestionLevel, TranslationKey> = {
  easy: 'congestionEasy',
  moderate: 'congestionModerate',
  busy: 'congestionBusy',
};

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
      <span className="mt-0.5 w-10 shrink-0 text-xs font-extrabold text-app-text-muted">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

function SpotLink({ candidate, spot, t }: { candidate: Candidate; spot: TourApiSpot; t: (k: TranslationKey) => string }) {
  const km = spotDistanceKm(candidate, spot);
  return (
    <a
      href={kakaoPlaceUrl(spot.title, Number(spot.mapy), Number(spot.mapx))}
      target="_blank"
      rel="noreferrer noopener"
      className="group block"
      aria-label={fillPlaceholders(t('viewOnKakaoMap'), { title: spot.title })}
    >
      <p className="flex items-center gap-1 text-sm font-extrabold text-app-text group-hover:text-brand-blue">
        <span>{spot.title}</span>
        <ExternalLink size={11} className="shrink-0 text-app-text-muted" aria-hidden />
      </p>
      {km != null && (
        <p className="flex items-center gap-1 text-[0.6875rem] font-bold text-app-text-muted">
          <MapPin size={10} className="shrink-0" aria-hidden />
          {formatFromSite(km, t)}
        </p>
      )}
    </a>
  );
}

interface PlanResultProps {
  candidate: Candidate;
  timeBudget: TimeBudget;
  afternoonIndex: number;
  onSwapAfternoon: () => void;
  onBack: () => void;
  onGo: () => void;
}

export function PlanResult({
  candidate,
  timeBudget,
  afternoonIndex,
  onSwapAfternoon,
  onBack,
  onGo,
}: PlanResultProps) {
  const { t, language } = useSettings();
  const { site, crowding, lunch, afternoon, facilities, loading } = candidate;
  const pick = afternoon[afternoonIndex] ?? afternoon[0] ?? null;
  const nextPick = afternoon[afternoonIndex + 1] ?? null;
  const showLunch = timeBudget !== '반나절';

  const nearbyLine = (() => {
    if (crowding == null) return loading ? t('planLoadingNearby') : t('nearbyUnknown');
    // reasons 는 산식이 만드는 한국어 문장 — 다른 언어에선 「추정」만.
    const reason = language === 'ko' ? crowding.reasons[0] : undefined;
    const tail = crowding.isPartial ? t('nearbyPartial') : reason ? `${reason}` : t('nearbyEstimate');
    return `${t(NEARBY_KEY[crowding.level])} · ${tail}`;
  })();

  const nearbyFailed = facilities == null && !loading;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm font-bold text-brand-blue"
        id="plan-back"
      >
        <ChevronLeft size={16} aria-hidden />
        {t('planBackToCards')}
      </button>

      <div className="mb-5 overflow-hidden rounded-[20px] border border-app-border bg-white">
        <button type="button" onClick={onGo} className="block w-full text-left" id="plan-site">
          <div className="h-40 overflow-hidden bg-app-bg">
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
              <p className="text-base font-extrabold text-app-text leading-tight">{site.name}</p>
              <p className="mt-0.5 text-xs font-bold text-app-text-muted">
                {site.location ? `${site.location} · ` : ''}
                {formatFromOrigin(candidate.distanceKm, t)}
              </p>
            </button>
            <p className="mt-1 text-xs font-bold text-app-text" id="plan-nearby-crowding">
              {nearbyLine}
            </p>
          </Row>

          {showLunch && (
            <Row label={t('planLunch')}>
              {lunch ? (
                <SpotLink candidate={candidate} spot={lunch} t={t} />
              ) : (
                <p className="text-sm font-bold text-app-text-muted">
                  {loading ? t('planLoadingNearby') : nearbyFailed ? t('planNearbyFailed') : t('planNoLunch')}
                </p>
              )}
            </Row>
          )}

          <Row label={t('planAfternoon')}>
            {pick ? (
              <>
                <SpotLink candidate={candidate} spot={pick.spot} t={t} />
                {pick.congestion != null && pick.level && (
                  <p className="mt-1 text-[0.6875rem] font-bold text-app-text-muted" id="plan-congestion">
                    {fillPlaceholders(t('congestionLabel'), { rate: Math.round(pick.congestion) })} ·{' '}
                    {t(CONGESTION_KEY[pick.level])}
                  </p>
                )}
                {pick.level === 'busy' && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-orange-50 p-3 text-xs font-bold text-orange-900">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
                    <span>
                      {nextPick
                        ? fillPlaceholders(t('planCrowdedAfternoon'), { name: nextPick.spot.title })
                        : t('planCrowdedAfternoonNoAlt')}
                      {nextPick && (
                        <button
                          type="button"
                          onClick={onSwapAfternoon}
                          className="ml-2 underline"
                          id="plan-swap-afternoon"
                        >
                          {t('planSwap')}
                        </button>
                      )}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-bold text-app-text-muted">
                {loading ? t('planLoadingNearby') : nearbyFailed ? t('planNearbyFailed') : t('planNoAfternoon')}
              </p>
            )}
          </Row>

          {timeBudget === '1박2일' && (
            <li className="rounded-xl bg-app-bg p-3 text-xs font-bold text-app-text-muted" id="plan-day2">
              {t('planDay2Pending')}
            </li>
          )}
        </ol>
        <p className="border-t border-app-border px-5 py-2 text-[0.5625rem] font-bold text-app-text-muted">
          {t('compassRealtimeSource')}
        </p>
      </div>

      <button
        type="button"
        onClick={onGo}
        className="w-full rounded-[20px] bg-brand-blue py-4 text-sm font-bold text-white shadow-lg shadow-brand-blue/20"
        id="quiz-go"
      >
        {t('planGoWithThis')}
      </button>
    </div>
  );
}
