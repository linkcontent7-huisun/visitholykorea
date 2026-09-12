import { BookOpen, Compass, Footprints, Home, Map as MapIcon, Settings } from 'lucide-react';
import type { ComponentType } from 'react';
import { paths } from '@/app/routes/paths';
import type { TranslationKey } from '@/shared/i18n/dictionary';

/**
 * 내비게이션 항목의 단일 출처.
 *
 * 같은 목록을 하단 탭(BottomNav)과 상단 내비(TopNav)가 함께 읽는다.
 * 두 곳에 배열을 복사해 두면 탭을 하나 추가할 때 한쪽만 고치는 사고가 반드시 난다.
 */
export interface NavItem {
  id: string;
  to: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  labelKey: TranslationKey;
  end: boolean;
}

/**
 * 하단 탭 4개 — 모바일 기준.
 *
 * 「탐색」 탭은 뺐다 (2026-09-12, 60대 피드백 "기능이 많고 겹친다"). 교구별 목록과
 * 검색은 「지도」 탭이 이미 하고, 순례 코스·즐겨찾기는 홈과 상세에서 간다.
 * `/explore` 화면 자체는 남아 있어 홈의 "탐색 →" 링크로 들어갈 수 있다.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', to: paths.home, icon: Home, labelKey: 'home', end: true },
  { id: 'map', to: paths.map, icon: MapIcon, labelKey: 'map', end: false },
  { id: 'record', to: paths.records, icon: BookOpen, labelKey: 'record', end: false },
  { id: 'menu', to: paths.menu, icon: Settings, labelKey: 'menu', end: false },
];

/**
 * 데스크톱 상단 내비에만 노출하는 항목.
 *
 * 넓은 화면에서는 하단 탭 5개로 좁힐 이유가 없다 — 모바일에서 `더보기` 안에
 * 숨어 있던 순례 코스·마음 나침반을 한 줄로 꺼낸다. 로고가 홈을 대신하므로
 * `home` 은 빼고 시작한다.
 */
export const TOP_NAV_ITEMS: readonly NavItem[] = [
  { id: 'explore', to: paths.explore, icon: Compass, labelKey: 'explore', end: false },
  { id: 'map', to: paths.map, icon: MapIcon, labelKey: 'map', end: false },
  { id: 'routes', to: paths.routes, icon: Footprints, labelKey: 'routesTitle', end: false },
  { id: 'compass', to: paths.compass, icon: Compass, labelKey: 'compassTitle', end: false },
  { id: 'record', to: paths.records, icon: BookOpen, labelKey: 'record', end: false },
  { id: 'menu', to: paths.menu, icon: Settings, labelKey: 'menu', end: false },
];
