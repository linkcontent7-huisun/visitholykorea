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
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<LoadingSpinner />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
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
  { path: paths.login, element: withSuspense(<LoginPage />) },
  { path: '*', element: withSuspense(<NotFoundPage />) },
]);
