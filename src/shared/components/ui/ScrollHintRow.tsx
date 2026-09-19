import { ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';

/**
 * 가로 스크롤 줄 — 더 볼 게 있으면 오른쪽에 옅은 그라디언트 + 화살표로 알려준다(2026-09-17,
 * SiteDetailPage 에서 처음 씀). `no-scrollbar` 라 스크롤바가 안 보여서, 더 있다는 사실 자체를
 * 모르고 지나치는 사람이 있었다 — 시·도 칩 줄처럼 스크롤이 필요한 다른 화면에도 그대로 쓴다.
 */
export function ScrollHintRow({
  children,
  className = '',
  /** 그라디언트가 녹아드는 배경색 — 줄이 놓이는 배경에 맞춘다(기본은 흰 카드 배경) */
  fadeFrom = 'from-white',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  fadeFrom?: string;
} & ComponentPropsWithoutRef<'div'>) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setHasMore(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  return (
    <div className="relative">
      <div ref={ref} className={`no-scrollbar overflow-x-auto ${className}`} {...rest}>
        {children}
      </div>
      {hasMore && (
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-end bg-gradient-to-l ${fadeFrom} to-transparent`}
          aria-hidden
        >
          <ChevronRight size={18} className="text-app-text-muted" />
        </div>
      )}
    </div>
  );
}
