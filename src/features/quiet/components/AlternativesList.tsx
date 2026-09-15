/**
 * 고요 속으로 — 결과 카드 리스트.
 *
 * 출발점(붐비는 관광지)은 흰 카드, 대안 성지는 보라 포인트로 눈이 먼저 가게 한다.
 * 추천의 근거(등급·직선거리)와 한계(예상값·확인 부족)를 카드 안에서 같이 보여준다 —
 * 근거 없는 "가장 조용한 성지" 같은 말은 어디에도 쓰지 않는다.
 *
 * 결과 분기(`outcome`)에 따라 아예 추천하지 않는 경우가 있다:
 *   origin_quiet       출발지가 이미 조용 → 이동을 권하지 않는다
 *   origin_unverified  출발지 정보 부족 → 비교 근거가 없어 추천하지 않는다
 *   none               확인된 대안 없음
 */

import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import type { Alternative, AlternativeResult } from '../api/alternatives';
import { ALTERNATIVE, buildAlternativeReason } from '../api/alternatives';
import { CrowdingBadge } from './CrowdingBadge';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { localizeCrowdingLevel, localizeDomainValue } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';

interface AlternativesListProps {
  result: AlternativeResult;
  /** 확인 부족 후보를 다시 계산하고 싶을 때 */
  onRetry?: () => void;
}

function formatYmd(ymd: string | undefined): string {
  if (!ymd || ymd.length !== 8) return '';
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

function AlternativeCard({
  origin,
  alt,
  index,
}: {
  origin: AlternativeResult['origin'];
  alt: Alternative;
  index: number;
}) {
  const { t, language } = useSettings();
  const originLevel = localizeCrowdingLevel(origin.crowding.level, t);
  return (
    <li className="rounded-[20px] border border-brand-violet/20 bg-white p-5">
      <Link to={paths.siteDetail(alt.site.id)} className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-violet text-sm font-semibold text-white">
              {index + 1}
            </span>
            <h4 className="text-base font-bold text-app-text">{alt.site.name}</h4>
          </div>

          <p className="text-sm leading-relaxed text-app-text-muted">
            {buildAlternativeReason(
              origin.name,
              originLevel,
              alt,
              language,
              localizeCrowdingLevel(alt.crowding.level, t),
            )}
          </p>
          {alt.travel.mode === '도보권' && (
            <p className="text-xs text-app-text-muted">{t('walkableHint')}</p>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <CrowdingBadge
              level={alt.crowding.level}
              score={alt.crowding.score}
              isPartial={alt.crowding.isPartial}
              source={alt.crowding.source}
              measuredSpot={alt.crowding.measuredSpot}
            />
            <span className="inline-flex items-center rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs font-medium text-app-text-muted">
              {localizeDomainValue(alt.site.category, t)}
            </span>
          </div>

          {alt.site.location && (
            <p className="text-xs text-app-text-muted">{alt.site.location}</p>
          )}
        </div>

        {/* 사진 없는 성지도 빈칸이 아니라 임시 이미지로 (SiteThumbnail 이 처리) */}
        <SiteThumbnail
          imageUrl={alt.site.imageUrl}
          name={alt.site.name}
          category={alt.site.category}
          className="size-20 shrink-0 rounded-xl object-cover"
        />
      </Link>
    </li>
  );
}

export function AlternativesList({ result, onRetry }: AlternativesListProps) {
  const { t } = useSettings();
  const { origin, picks, relaxed, unverified, outcome } = result;
  const measured = origin.crowding.measuredSpot;

  return (
    <div className="space-y-4">
      {/* 출발점 카드 */}
      <div className="rounded-[20px] border border-app-border bg-white p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-extrabold tracking-tight text-app-text">{origin.name}</h3>
            <p className="text-sm text-app-text-muted">{origin.address}</p>
            <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
              {t('crowdingBasisLabel')}
            </p>
            <div className="flex items-center gap-2">
              <CrowdingBadge
                level={origin.crowding.level}
                score={origin.crowding.score}
                isPartial={origin.crowding.isPartial}
                source={origin.crowding.source}
                measuredSpot={measured}
              />
            </div>
            {measured && (
              <p className="text-xs leading-relaxed text-app-text-muted">
                {fillPlaceholders(t('crowdingMeasuredNote'), {
                  name: measured.name,
                  distance: measured.distanceKm != null ? `${measured.distanceKm}km` : '—',
                  date: formatYmd(measured.baseYmd) || '—',
                })}
              </p>
            )}
          </div>
          {origin.imageUrl && (
            <img
              src={origin.imageUrl}
              alt=""
              width={80}
              height={80}
              loading="lazy"
              className="size-20 rounded-xl object-cover"
            />
          )}
        </div>
      </div>

      {/* 출발지 자체를 비교할 수 없거나 이미 조용하면 여기서 끝낸다 */}
      {outcome === 'origin_unverified' && (
        <div
          className="rounded-[20px] border border-dashed border-app-border bg-white p-6 text-center"
          role="status"
        >
          <p className="text-sm font-bold text-app-text">{t('quietOriginUnverifiedTitle')}</p>
          <p className="mt-2 text-xs leading-relaxed text-app-text-muted">
            {t('quietOriginUnverifiedBody')}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 min-h-11 rounded-full border border-app-border px-5 text-sm font-bold text-app-text"
            >
              {t('retry')}
            </button>
          )}
        </div>
      )}

      {outcome === 'origin_quiet' && (
        <div
          className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-6 text-center"
          role="status"
        >
          <p className="text-sm font-bold text-emerald-900">{t('quietOriginQuietTitle')}</p>
          <p className="mt-2 text-xs leading-relaxed text-emerald-900/80">
            {t('quietOriginQuietBody')}
          </p>
          <Link
            to={paths.search}
            className="mt-4 inline-flex min-h-11 items-center rounded-full bg-white px-5 text-sm font-bold text-emerald-900"
          >
            {t('findShrines')}
          </Link>
        </div>
      )}

      {(outcome === 'recommended' || outcome === 'relaxed' || outcome === 'none') && (
        <>
          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-app-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-app-bg px-3 text-sm font-bold text-brand-violet">
                {t('alternativesInsteadLabel')}
              </span>
            </div>
          </div>

          {picks.length > 0 ? (
            <ul className="space-y-3">
              {picks.map((alt, idx) => (
                <AlternativeCard key={alt.site.id} origin={origin} alt={alt} index={idx} />
              ))}
            </ul>
          ) : (
            <div className="rounded-[20px] border border-dashed border-app-border bg-white p-8 text-center">
              <p className="text-sm font-bold text-app-text">{t('quietNoneTitle')}</p>
              <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
                {fillPlaceholders(t('alternativesEmptyBody'), {
                  radius: ALTERNATIVE.searchRadiusKm,
                })}
                <br />
                {t('alternativesEmptyHint')}
              </p>
            </div>
          )}

          {relaxed && (
            <p className="rounded-[20px] border border-app-border bg-white p-4 text-sm text-app-text-muted">
              ℹ️{' '}
              {fillPlaceholders(t('alternativesRelaxedNote'), {
                radius: ALTERNATIVE.searchRadiusKm,
              })}
            </p>
          )}
        </>
      )}

      {/* 확인 부족 — 순위에 넣지 않았음을 밝히고 따로 보여준다 */}
      {unverified.length > 0 && outcome !== 'origin_quiet' && (
        <section aria-labelledby="unverified-heading" className="space-y-2">
          <h4 id="unverified-heading" className="text-sm font-bold text-app-text-muted">
            {t('quietUnverifiedTitle')}
          </h4>
          <p className="text-xs leading-relaxed text-app-text-muted">{t('quietUnverifiedBody')}</p>
          <ul className="space-y-2">
            {unverified.map((alt) => (
              <li key={alt.site.id}>
                <Link
                  to={paths.siteDetail(alt.site.id)}
                  className="flex items-center justify-between gap-3 rounded-[16px] border border-dashed border-app-border bg-white px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-app-text">
                      {alt.site.name}
                    </span>
                    <span className="block text-xs text-app-text-muted">{alt.travel.label}</span>
                  </span>
                  <CrowdingBadge level={alt.crowding.level} score={alt.crowding.score} isPartial />
                </Link>
              </li>
            ))}
          </ul>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="min-h-11 rounded-full border border-app-border bg-white px-5 text-sm font-bold text-app-text"
            >
              {t('retry')}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
