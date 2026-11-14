import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import { SiteNotesSection } from '@/features/passport/components/site-notes/SiteNotesSection';
import { NearbyPilgrimPlaces } from '@/features/places/components/NearbyPilgrimPlaces';
import { ProgramPromo } from '@/features/programs/components/ProgramCardPopup';
import { NearbyParishesCard } from '@/features/directory/components/NearbyParishesCard';
import { useSitePhoto } from '@/features/sites/hooks/use-featured-photos';
import { useSite } from '@/features/sites/hooks/use-sites';
import { useTranslatedSite } from '@/features/sites/hooks/use-site-translation';
import { VirtualTourCard } from '@/features/virtual-tour/components/VirtualTourCard';
import { virtualTourForSite } from '@/features/virtual-tour/data/virtual-tours';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { useSettings } from '@/shared/i18n/use-settings';
import { NearbyTourismSections } from './site-detail/NearbyTourismSections';
import { SameDioceseSites } from './site-detail/SameDioceseSites';
import { SiteHero } from './site-detail/SiteHero';
import { SiteStorySection } from './site-detail/SiteStorySection';
import { VisitInfoSection } from './site-detail/VisitInfoSection';

/**
 * 성지 상세 — 절(節)을 순서대로 조립만 한다.
 * 각 절의 상태·조회는 그 절 컴포넌트가 들고 있다(#102, 2026-11-14 에 1,117줄에서 나눔).
 * 순서를 바꿀 때는 아래 주석의 사장님 지적 날짜를 먼저 본다.
 */
export default function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>();
  const navigate = useNavigate();
  const { t } = useSettings();

  const { data: site, isLoading } = useSite(siteId);
  const view = useTranslatedSite(site);
  const location = useLocation();
  // 마음 나침반에서 「이 코스로 가볼게요」로 오면 #directions — 「방문 정보」로 스크롤한다
  const wantsDirections = location.hash === '#directions';
  useEffect(() => {
    if (!wantsDirections || !site) return;
    // 스크롤은 body 가 아니라 앱 상자(#app-scroll)가 한다 — 요소 기준으로 옮긴다
    const el = document.getElementById('visit-info-heading');
    el?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [wantsDirections, site]);
  // 즐겨찾기 단추 옆 「기록하기」 — 순례 기록이 이 서비스의 핵심인데도 이야기·도슨트
  // 아래로 밀려 있어 접근하기 어렵다는 지적(사장님, 2026-09-20)으로 앵커를 만든다.
  const scrollToRecordSection = () => {
    document
      .getElementById('reviews-heading')
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };
  // 공식 사진이 없으면 순례자가 보내준(운영자 승인) 사진이 대표 자리를 채운다.
  // 훅이므로 이른 return 위에서 부른다.
  const sitePhoto = useSitePhoto(siteId, site?.imageUrl ?? null);
  const { data: isFavorited = false } = useIsFavorite(siteId);
  const toggleFavorite = useToggleFavorite(siteId ?? '');

  const handleToggleFavorite = () => {
    toggleFavorite.mutate(!isFavorited, {
      onSuccess: (result) => {
        if (result.success) return;
        if (result.error === 'UNAUTHENTICATED') {
          navigate(paths.login);
          return;
        }
        window.alert(t('saveFailedFavorite'));
      },
    });
  };

  if (isLoading) return <LoadingSpinner />;

  if (!site) {
    return <EmptyState title={t('siteNotFound')} />;
  }

  const virtualTour = virtualTourForSite(siteId);

  return (
    // 상단바·하단 탭이 있는 AppLayout 안에서 뜬다(2026-09-17) — 아래 여백은 AppLayout 이 탭 높이만큼 준다.
    // 본문 폭은 홈과 같은 PageContainer(기본 1200px) 로 — 예전엔 이 화면만 max-w-3xl(768px) 라
    // PC 에서 유독 좌우 여백이 넓어 보였다(사장님 지적, 2026-09-17).
    <div className="min-h-page bg-white pb-12">
      <SiteHero
        site={site}
        view={view}
        heroPhoto={sitePhoto}
        isFavorited={isFavorited}
        favoritePending={toggleFavorite.isPending}
        onToggleFavorite={handleToggleFavorite}
        onRecordAnchor={scrollToRecordSection}
      />

      {/* 상단 라운드 처리를 없앴다(사장님 지적, 2026-09-17) — 사진 바로 아래가 흰 면으로
          깔끔하게 이어진다. margin-top 도 0으로 — 사진과 겹치지 않고 바로 이어진다(사장님 지적, 2026-09-18). */}
      <PageContainer className="relative z-10 mt-0 space-y-8 bg-white py-6">
        {/* 그 교구의 체험여행 프로그램 — 지금은 대전만(2026-11-03 본선 시연) */}
        <ProgramPromo region={site.region} />
        {/* 3D 가상 순례가 있는 성지만(지금은 명동대성당) — 성지 이야기보다 위에 둔다(2026-11-09 F1) */}
        {virtualTour && (
          <VirtualTourCard tour={virtualTour} variant="site" id="site-virtual-tour" />
        )}
        {/* 성지 이야기를 맨 위로 — 사진 다음에는 "여기가 어떤 곳인지" 이야기부터 읽고,
            미사 시간 같은 실용 정보는 그다음이 자연스럽다(사장님 지적, 2026-09-17).
            ⚠️ 이 순서는 재기획(2026-09-14) §4-1 이 정한 "방문 정보가 역사보다 위" 결정을
            뒤집는다 — 이번 지적을 그대로 따랐다. */}
        <SiteStorySection site={site} view={view} />

        <VisitInfoSection site={site} view={view} />

        <NearbyTourismSections site={site} />

        <SiteNotesSection site={site} />

        <SameDioceseSites site={site} />

        {/* 주변 본당·공소 — 「OO 교구의 다른 성지」 아래로 옮겼다(사장님 지적, 2026-09-17).
            성지끼리 비교가 끝난 다음에 볼 정보라 방문 정보보다 뒤, 화면 맨 끝이 자리다. */}
        <section className="pb-10">
          <NearbyParishesCard site={site} />
        </section>
        {/* 순례자가 새로 기록하고 관리자가 공개한 근처 장소 — 11/2 사장님 지시 「성지 상세 화면 아래에」 */}
        <div className="pb-10">
          <NearbyPilgrimPlaces site={site} />
        </div>
      </PageContainer>
    </div>
  );
}
