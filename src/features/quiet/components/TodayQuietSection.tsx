import { ChevronRight, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { isQuotaExceededError } from '@/shared/api/tour-api';
import { useLocalizedSites } from '@/features/sites/hooks/use-sites';
import type { HolySite } from '@/shared/types/domain';
import { useQuietSites } from '../hooks/use-quiet-sites';
import { QuietSiteCard } from './QuietSiteCard';

/** 오늘 날짜. 보는 사람의 언어로 적는다 — 한국어 날짜를 외국인이 읽을 수 없다. */
function todayLabel(locale: string): string {
  return new Date().toLocaleDateString(locale, {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * 홈 화면의 주인공. 오늘 조용한 성지를 한국관광공사 실시간 데이터로 계산해 보여준다.
 *
 * 계산 근거와 한계를 화면에서 숨기지 않는다 — 추정값을 사실처럼 보여주면
 * 한 번 틀렸을 때 서비스 전체의 신뢰가 무너진다.
 *
 * `variant="compact"` 는 사진 히어로형 홈(T-001)에서 쓴다. 히어로 사진이 이미
 * "오늘"을 대표하므로, 날짜 라벨·부제·근거 문장·대안 배너를 다시 반복하지 않고
 * 제목 + "더보기" 링크 + 이름/배지만 남긴 목록으로 축소한다.
 *
 * `padded={false}` 는 좌우 여백을 부모가 이미 잡고 있을 때 쓴다(반응형 셸의
 * `PageContainer` 안에 들어가는 경우). 기본값은 예전과 같은 `px-6` 이므로
 * 다른 화면의 호출부는 고치지 않아도 된다.
 */
export function TodayQuietSection({
  sites,
  variant = 'full',
  padded = true,
}: {
  sites: HolySite[];
  variant?: 'full' | 'compact';
  padded?: boolean;
}) {
  const { t, language } = useSettings();
  const { data: quietSitesRaw = [], isLoading, isError, error } = useQuietSites(sites, 3);
  /**
   * 여기서 다시 한번 이름을 번역한다 — `useQuietSites`의 캐시 키가 날짜·개수뿐이라
   * `sites`(위 useLocalizedSites 결과)가 나중에 번역본으로 바뀌어도 재계산을 트리거하지
   * 않는다. 그 결과 원문 이름으로 캐시된 채 화면에 남는 문제가 있었다(2026-09-11).
   */
  const localizedQuietSites = useLocalizedSites(quietSitesRaw.map((q) => q.site));
  const quietSites = quietSitesRaw.map((q, i) => ({
    ...q,
    site: localizedQuietSites[i] ?? q.site,
  }));
  const compact = variant === 'compact';

  const locatedCount = sites.filter(
    (s) => s.coordinates.lat != null && s.coordinates.lng != null,
  ).length;

  return (
    <section
      className={`${padded ? 'px-6' : ''} ${compact ? 'py-2' : 'py-6'}`}
    >
      <header className={compact ? 'mb-3 flex items-center justify-between gap-3' : 'mb-5'}>
        {compact ? (
          <>
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-lg font-bold text-app-text">
                <img src="/brand/dove.png" alt="" aria-hidden className="h-[22px] w-auto" />
                {t('quietHeroTitle')}
              </h2>
              {/* 위 칩줄의 「붐빔 피하기」와 같은 화면으로 간다는 것을 밝힌다(2026-09-07 피드백) */}
              <p className="mt-0.5 text-[0.6875rem] text-app-text-muted">{t('quietHeroCaption')}</p>
            </div>
            <Link
              to={paths.alternatives}
              className="shrink-0 text-[0.75rem] font-bold text-brand-violet"
            >
              {t('quietSeeMore')}
            </Link>
          </>
        ) : (
          <>
            <p className="mb-1 text-[0.6875rem] font-bold uppercase tracking-widest text-brand-violet">
              {todayLabel(SPEECH_LOCALE[language])}
            </p>
            <h2 className="flex items-center gap-2 text-2xl font-extrabold leading-tight tracking-tight text-app-text">
              <img src="/brand/dove.png" alt="" aria-hidden className="h-[28px] w-auto" />
              {t('quietHeroTitle')}
            </h2>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-app-text-muted">
              {t('quietHeroSubtitle')}
            </p>
          </>
        )}
      </header>

      {isLoading && (
        <div className="space-y-3" role="status" aria-live="polite">
          {!compact && (
            <p className="text-[0.75rem] font-medium text-app-text-muted">{t('quietLoading')}</p>
          )}
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={compact ? 'h-14 animate-pulse rounded-[16px] bg-app-bg' : 'h-28 animate-pulse rounded-[20px] bg-white'}
            />
          ))}
        </div>
      )}

      {isError && isQuotaExceededError(error) && (
        <div className="rounded-[20px] border border-app-border bg-white p-6 text-center">
          <p className="text-sm font-bold text-app-text">{t('quietQuotaTitle')}</p>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-app-text-muted">
            {t('quietQuotaBody')}
          </p>
        </div>
      )}

      {isError && !isQuotaExceededError(error) && (
        <div className="rounded-[20px] border border-app-border bg-white p-6 text-center">
          <p className="text-sm font-bold text-app-text">{t('quietErrorTitle')}</p>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-app-text-muted">
            {t('quietErrorBody')}
          </p>
          {error instanceof Error && (
            <p className="mt-3 text-[0.6875rem] text-app-text-muted opacity-60">{error.message}</p>
          )}
        </div>
      )}

      {!isLoading && !isError && quietSites.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-app-border bg-white p-8 text-center">
          <Wind size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-bold text-app-text">아직 계산할 성지가 없어요</p>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-app-text-muted">
            붐빔을 재려면 성지 좌표가 필요합니다.
            <br />
            현재 좌표가 확인된 곳은 {locatedCount}곳입니다.
          </p>
        </div>
      )}

      {quietSites.length > 0 && (
        <>
          <div className={compact ? 'space-y-2' : 'space-y-3'}>
            {quietSites.map((quiet) => (
              <QuietSiteCard key={quiet.site.id} {...quiet} compact={compact} />
            ))}
          </div>
          {/* compact(히어로형 홈)에서는 이 배너가 "붐빔피하기" 칩으로 옮겨가므로 반복하지 않는다. */}
          {!compact && (
            <Link
              to={paths.alternatives}
              className="mt-4 flex items-center justify-between rounded-[16px] border border-app-border bg-app-bg px-5 py-4 transition-all hover:border-brand-violet hover:bg-[#F3F0FF]"
            >
              <span className="text-sm font-extrabold text-app-text">
                {t('alternativesCta')}{' '}
                <span className="text-brand-violet">{t('alternativesCtaAccent')}</span>
              </span>
              <ChevronRight size={18} className="text-app-text-muted" aria-hidden />
            </Link>
          )}

          {/* 추정값이라는 사실을 화면에서 밝힌다 — 목록이 축소돼도 이 문장은 남긴다 */}
          <p className={`text-[0.6875rem] leading-relaxed text-app-text-muted opacity-70 ${compact ? 'mt-2' : 'mt-4'}`}>
            {t('quietDisclaimer')}
          </p>
        </>
      )}
    </section>
  );
}
