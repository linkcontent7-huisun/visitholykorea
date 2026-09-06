import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/app/layouts/AppLayout';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { paths } from './paths';

// 첫 화면 이후의 페이지는 필요할 때 내려받는다(초기 로딩 시간 단축).
const HomePage = lazy(() => import('@/pages/HomePage'));
const MapPage = lazy(() => import('@/pages/MapPage'));
const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const RecordsPage = lazy(() => import('@/pages/RecordsPage'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const SiteDetailPage = lazy(() => import('@/pages/SiteDetailPage'));
const SearchPage = lazy(() => import('@/pages/SearchPage'));
const RoutesPage = lazy(() => import('@/pages/RoutesPage'));
const RouteDetailPage = lazy(() => import('@/pages/RouteDetailPage'));
const CompassPage = lazy(() => import('@/pages/CompassPage'));
const AlternativesPage = lazy(() => import('@/pages/AlternativesPage'));
const FestivalsPage = lazy(() => import('@/pages/FestivalsPage'));
const RegionLandingPage = lazy(() => import('@/pages/RegionLandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
// 관리자 콘솔 — 순례자 화면과 함께 내려받지 않도록 여기서도 lazy 로 둔다.
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AdminSitePage = lazy(() => import('@/pages/AdminSitePage'));

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<LoadingSpinner />}>{node}</Suspense>;
}

/**
 * 라우트 오류의 마지막 안전망.
 *
 * 대부분의 청크 로딩 실패는 main.tsx 의 `vite:preloadError` 새로고침이 먼저
 * 처리한다. 그래도 여기까지 온 오류에게 개발자용 영어 화면 대신
 * 사용자 언어로 된 출구를 준다 — 설문 링크로 처음 온 분이 보는 화면일 수 있다.
 */
function RouteErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-app-bg px-8 text-center">
      <p className="text-4xl">🕯️</p>
      <h1 className="text-lg font-extrabold text-app-text">화면을 여는 데 문제가 생겼어요</h1>
      <p className="text-sm leading-relaxed text-app-text-muted">
        새 버전이 방금 배포되었을 수 있어요.
        <br />
        새로고침하면 대부분 해결됩니다.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-[16px] bg-brand-violet px-6 py-3 text-sm font-bold text-white"
      >
        새로고침
      </button>
      <a href="/" className="text-xs font-bold text-app-text-muted underline underline-offset-4">
        홈으로 돌아가기
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    // 경로 없는 최상위 — 모든 화면의 오류가 여기 errorElement 로 모인다
    errorElement: <RouteErrorPage />,
    children: [
      {
        // 하단 탭이 있는 기본 화면들
        element: <AppLayout />,
        children: [
          { path: paths.home, element: withSuspense(<HomePage />) },
          { path: paths.map, element: withSuspense(<MapPage />) },
          { path: paths.explore, element: withSuspense(<ExplorePage />) },
          { path: paths.records, element: withSuspense(<RecordsPage />) },
          { path: paths.menu, element: withSuspense(<MenuPage />) },
        ],
      },
      // 하단 탭 없이 전체 화면으로 뜨는 화면들
      { path: paths.siteDetailPattern, element: withSuspense(<SiteDetailPage />) },
      { path: paths.routes, element: withSuspense(<RoutesPage />) },
      { path: paths.routeDetailPattern, element: withSuspense(<RouteDetailPage />) },
      { path: paths.search, element: withSuspense(<SearchPage />) },
      { path: paths.compass, element: withSuspense(<CompassPage />) },
      { path: paths.alternatives, element: withSuspense(<AlternativesPage />) },
      { path: paths.festivals, element: withSuspense(<FestivalsPage />) },
      { path: paths.regionPattern, element: withSuspense(<RegionLandingPage />) },
      { path: paths.login, element: withSuspense(<LoginPage />) },
      { path: paths.terms, element: withSuspense(<TermsPage />) },
      { path: paths.faq, element: withSuspense(<FaqPage />) },
      { path: paths.admin, element: withSuspense(<AdminPage />) },
      { path: paths.adminSitePattern, element: withSuspense(<AdminSitePage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);
