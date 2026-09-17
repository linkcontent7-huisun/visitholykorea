import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * 고르는 칩 — 지역 필터·「성지 / 성당」 탭·정렬 토글처럼 **여러 개 중 하나를 켜는** 단추.
 * 행동 버튼(`Button`)과 달리 알약 모양이라 「누르면 어디로 간다」가 아니라 「골라 둔다」로 읽힌다.
 * 켜짐은 남색 채움 + 흰 글자, 꺼짐은 회색 선. 높이 44px 이상 (2026-09-17 화면 규칙).
 *
 * `aria-pressed`(토글)나 `role="tab"`+`aria-selected`(탭)는 호출부가 붙인다.
 */
import { chipClass } from './class-names';

export function Chip({
  active,
  className = '',
  children,
  type = 'button',
  ...rest
}: {
  active: boolean;
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>) {
  return (
    <button type={type} className={chipClass(active, className)} {...rest}>
      {children}
    </button>
  );
}
