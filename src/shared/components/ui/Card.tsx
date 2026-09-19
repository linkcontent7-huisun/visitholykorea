import type { HTMLAttributes, ReactNode } from 'react';

/**
 * 카드 한 벌 (2026-09-17 화면 규칙). 모서리 8px · 선 1px · 안쪽 20px, 그림자 없음.
 *
 * - `white`  흰 바탕 — 종이색 화면 위의 기본 카드
 * - `panel`  종이색 바탕 — 흰 화면 안에서 한 단 들어간 정보(성지 상세)
 * - `dashed` 점선 — 「확인되지 않음」「결과 없음」처럼 내용이 비어 있음을 알리는 자리
 * - `soft`   연남색 — 로그인 상태 같은 짧은 안내
 */
import { cardClass, type CardTone } from './class-names';

export function Card({
  tone = 'white',
  padded = true,
  className = '',
  children,
  ...rest
}: {
  tone?: CardTone;
  /** 안쪽 여백을 직접 잡을 때(목록을 카드 안에 꽉 채울 때) false */
  padded?: boolean;
  className?: string;
  children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children'>) {
  return (
    <div className={cardClass(tone, padded, className)} {...rest}>
      {children}
    </div>
  );
}
