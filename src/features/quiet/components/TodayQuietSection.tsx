import { ChevronRight, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { isQuotaExceededError } from '@/shared/api/tour-api';
import type { HolySite } from '@/shared/types/domain';
import { useQuietSites } from '../hooks/use-quiet-sites';
import { QuietSiteCard } from './QuietSiteCard';

/** 오늘 날짜를 "8월 5일 화요일" 형태로 */
function todayLabel(): string {
  return new Date().toLocaleDateString('ko-KR', {
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
  const { data: quietSites = [], isLoading, isError, error } = useQuietSites(sites, 3);

  const locatedCount = sites.filter(
    (s) => s.coordinates.lat != null && s.coordinates.lng != null,
  ).length;

  return (
    <section className="px-6 py-6">
      <header className="mb-5">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-brand-violet">
          {todayLabel()}
        </p>
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-app-text">
          고요 속으로
        </h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-app-text-muted">
          한국관광공사 실시간 축제·관광 정보로 일상의 소음을 한 발 물러났어요
        </p>
      </header>

      {isLoading && (
        <div className="space-y-3" role="status" aria-live="polite">
          <p className="text-[12px] font-medium text-app-text-muted">
            오늘 열리는 행사를 확인하는 중…
          </p>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-[20px] bg-white" />
          ))}
        </div>
      )}

      {isError && isQuotaExceededError(error) && (
        <div className="rounded-[20px] border border-app-border bg-white p-6 text-center">
          <p className="text-sm font-bold text-app-text">오늘 조회 한도에 도달했어요</p>
          <p className="mt-2 text-[12px] leading-relaxed text-app-text-muted">
            많은 분이 함께 보고 계셔서 오늘의 관광 정보 조회가 잠시 멈췄어요.
            <br />
            내일 다시 열어보시면 정상적으로 보여요.
          </p>
        </div>
      )}

      {isError && !isQuotaExceededError(error) && (
        <div className="rounded-[20px] border border-app-border bg-white p-6 text-center">
          <p className="text-sm font-bold text-app-text">오늘의 붐빔을 계산하지 못했어요</p>
          <p className="mt-2 text-[12px] leading-relaxed text-app-text-muted">
            관광 정보를 불러오는 중 문제가 생겼습니다. 잠시 후 다시 열어주세요.
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
              가려던 곳이 붐빈다면? <span className="text-brand-violet">대신 여기</span>
            </span>
            <ChevronRight size={18} className="text-app-text-muted" aria-hidden />
          </Link>

          {/* 추정값이라는 사실을 화면에서 밝힌다 */}
          <p className="mt-4 text-[11px] leading-relaxed text-app-text-muted opacity-70">
            공사 데이터에는 실시간 혼잡도가 없어, 오늘 열리는 행사와 주변 관광 시설 밀도로 추정한
            값입니다. 실제와 다를 수 있어요.
          </p>
        </>
      )}
    </section>
  );
}
