import { BookOpen, Compass, Footprints, Home, Map as MapIcon, Menu } from 'lucide-react';
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

/** 하단 탭 5개 — 모바일 기준. 순서와 라벨은 기존과 동일하다. */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', to: paths.home, icon: Home, labelKey: 'home', end: true },
  { id: 'map', to: paths.map, icon: MapIcon, labelKey: 'map', end: false },
  { id: 'explore', to: paths.explore, icon: Compass, labelKey: 'explore', end: false },
  { id: 'record', to: paths.records, icon: BookOpen, labelKey: 'record', end: false },
  { id: 'menu', to: paths.menu, icon: Menu, labelKey: 'menu', end: false },
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
  { id: 'menu', to: paths.menu, icon: Menu, labelKey: 'menu', end: false },
];
