import { BookOpen, Home, Menu, Search, Wind } from 'lucide-react';
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
 * 하단 탭 5개 — 재기획(2026-09-14) 정보 구조 그대로.
 *
 *   홈 · 성지 찾기 · 고요 속으로 · 내 기록 · 더보기
 *
 * 「지도」는 배경 없는 점 지도라 주 탐색 수단이 못 되어 더보기 안 「전국 성지 분포 개요」로,
 * 「홈화면 추가」는 더보기 안으로 옮겼다. 「고요 속으로」와 「붐빔 피하기」처럼 같은 기능이
 * 두 이름으로 보이던 것은 하나로 합쳤다.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', to: paths.home, icon: Home, labelKey: 'home', end: true },
  { id: 'search', to: paths.search, icon: Search, labelKey: 'findShrines', end: false },
  { id: 'quiet', to: paths.quiet, icon: Wind, labelKey: 'quietHeroTitle', end: false },
  { id: 'record', to: paths.records, icon: BookOpen, labelKey: 'myRecords', end: false },
  { id: 'menu', to: paths.menu, icon: Menu, labelKey: 'moreTab', end: false },
];

/**
 * 데스크톱 상단 내비 — 로고가 홈을 대신하므로 `home` 만 빼고 하단 탭과 같다.
 * 넓은 화면이라고 다른 구조를 주면 휴대폰과 PC 를 오가는 사람이 길을 잃는다.
 */
export const TOP_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter((item) => item.id !== 'home');
