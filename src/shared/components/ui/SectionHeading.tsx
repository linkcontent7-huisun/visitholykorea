import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * 절(section) 제목 한 벌 (2026-09-17 화면 규칙).
 *
 * 홈의 `SectionTitle` 과 성지 상세의 「보라 세로줄 + h2」(열 곳에 복사돼 있던 것)를 하나로 합쳤다.
 * 세로줄은 뺐다 — 명조 제목만으로 절이 구분되고, 줄이 있던 자리만큼 왼쪽 정렬이 어긋났다.
 *
 * - `size="lg"` 24px·PC 28px — 화면을 나누는 절
 * - `size="md"` 18px — 카드 안의 작은 절(방문 정보 안 「연락처」「찾아가는 길」)
 * `meta` 는 제목 옆 작은 출처 표기(「관광공사 실시간」), `action` 은 오른쪽 「전체 보기」 링크.
 */
export function SectionHeading({
  title,
  sub,
  meta,
  action,
  size = 'lg',
  as: Tag = 'h2',
  id,
  className = '',
}: {
  title: ReactNode;
  sub?: ReactNode;
  meta?: ReactNode;
  action?: { to: string; label: string };
  size?: 'lg' | 'md';
  as?: 'h2' | 'h3';
  id?: string;
  className?: string;
}) {
  const titleClass =
    size === 'lg'
      ? 'font-display text-[1.5rem] font-bold leading-tight lg:text-[1.75rem]'
      : 'text-lg font-bold leading-tight';
  return (
    <div className={`mb-4 flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Tag id={id} className={`break-keep text-app-text ${titleClass}`}>
            {title}
          </Tag>
          {meta && <span className="text-xs font-bold text-app-text-muted">{meta}</span>}
        </div>
        {sub && <p className="mt-1 text-sm leading-relaxed text-app-text-muted">{sub}</p>}
      </div>
      {action && (
        <Link
          to={action.to}
          className="-mr-2 flex min-h-11 shrink-0 items-center rounded-lg px-2 text-[0.9375rem] font-bold text-brand-blue transition-colors hover:bg-app-bg"
        >
          {action.label}
          <ChevronRight size={16} className="ml-0.5 inline" aria-hidden />
        </Link>
      )}
    </div>
  );
}
