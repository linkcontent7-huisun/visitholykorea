import { ChevronRight, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { isQuotaExceededError } from '@/shared/api/tour-api';
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
 */
export function TodayQuietSection({ sites }: { sites: HolySite[] }) {
  const { t, language } = useSettings();
  const { data: quietSites = [], isLoading, isError, error } = useQuietSites(sites, 3);

  const locatedCount = sites.filter(
    (s) => s.coordinates.lat != null && s.coordinates.lng != null,
  ).length;

  return (
    <section className="px-6 py-6">
      <header className="mb-5">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-brand-violet">
          {todayLabel(SPEECH_LOCALE[language])}
        </p>
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-app-text">
          {t('quietHeroTitle')}
        </h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-text-muted">
          {t('quietHeroSubtitle')}
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3" role="status" aria-live="polite">
          <p className="text-[12px] font-medium text-app-text-muted">
            {t('quietLoading')}
          </p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[20px] bg-white" />
          ))}
        </div>
      )}

      {isError && isQuotaExceededError(error) && (
        <div className="rounded-[20px] border border-app-border bg-white p-6 text-center">
          <p className="text-sm font-bold text-app-text">{t('quietQuotaTitle')}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-app-text-muted">
            {t('quietQuotaBody')}
          </p>
        </div>
      )}

      {isError && !isQuotaExceededError(error) && (
        <div className="rounded-[20px] border border-app-border bg-white p-6 text-center">
          <p className="text-sm font-bold text-app-text">{t('quietErrorTitle')}</p>
          <p className="mt-2 text-[12px] leading-relaxed text-app-text-muted">
            {t('quietErrorBody')}
          </p>
          {error instanceof Error && (
            <p className="mt-3 text-[11px] text-app-text-muted opacity-60">{error.message}</p>
          )}
        </div>
      )}

      {!isLoading && !isError && quietSites.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-app-border bg-white p-8 text-center">
          <Wind size={28} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-bold text-app-text">아직 계산할 성지가 없어요</p>
          <p className="mt-2 text-[12px] leading-relaxed text-app-text-muted">
            붐빔을 재려면 성지 좌표가 필요합니다.
            <br />
            현재 좌표가 확인된 곳은 {locatedCount}곳입니다.
          </p>
        </div>
      )}

      {quietSites.length > 0 && (
        <>
          <div className="space-y-3">
            {quietSites.map((quiet) => (
              <QuietSiteCard key={quiet.site.id} {...quiet} />
            ))}
          </div>
          {/* 이 섹션은 "오늘 조용한 곳"을 보여준다. 반대 방향 — 가려던 곳이 붐빌 때
              대신 갈 성지를 찾는 것 — 은 별도 화면에서 한다. */}
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

          {/* 추정값이라는 사실을 화면에서 밝힌다 */}
          <p className="mt-4 text-[11px] leading-relaxed text-app-text-muted opacity-70">
            {t('quietDisclaimer')}
          </p>
        </>
      )}
    </section>
  );
}
