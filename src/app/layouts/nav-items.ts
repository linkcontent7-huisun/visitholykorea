import { BookOpen, CalendarHeart, Home, Menu, Search } from 'lucide-react';
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
 * 하단 탭 5개 — 2026-09-16 회의 · 시안 확정.
 *
 *   홈 · 성지 찾기 · 기록 · 성지 일정 · 더보기
 *
 * 「기록」이 이 서비스의 중심이라(사장님, 9/16) 가운데에 두고 `BottomNav` 가 솟은 둥근 단추로 키운다 —
 * 재기획 이전(9/13, `908543a`) 방식. 회의록의 「지도」 대신 「성지 일정」을 남겼다(사장님 결정, 같은 날).
 * 세 번째 라벨은 「성지 일정」 — 「오늘의 성지 일정」은 390px 폭에서 잘린다(시안 렌더로 확인).
 * 「지도」는 더보기 안 「전국 성지 분포 개요」로, 「홈화면 추가」도 더보기 안에 있다.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: 'home', to: paths.home, icon: Home, labelKey: 'home', end: true },
  { id: 'search', to: paths.search, icon: Search, labelKey: 'findShrinesShort', end: false },
  { id: 'record', to: paths.records, icon: BookOpen, labelKey: 'record', end: false },
  { id: 'plan', to: paths.compass, icon: CalendarHeart, labelKey: 'todayPlanShort', end: false },
  { id: 'menu', to: paths.menu, icon: Menu, labelKey: 'moreTab', end: false },
];

/**
 * 「기록·성지 일정·더보기」 세 개 — 로고가 홈을 대신하므로 `home`, 홈 입구 카드와 겹치는
 * `search` 를 뺀다. 상단바(`TopNav`)는 이 셋도 로그인해야 의미가 있다는 이유로 헤더에서
 * 완전히 뺐고(2026-09-17 오후), 지금은 더보기 화면(`MenuPage`)의 「전체 서비스」 목록에만 쓰인다.
 */
export const TOP_NAV_ITEMS: readonly NavItem[] = NAV_ITEMS.filter(
  (item) => item.id !== 'home' && item.id !== 'search',
);
