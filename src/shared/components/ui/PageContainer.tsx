import type { ReactNode } from 'react';

/**
 * 본문 폭을 정하는 유일한 곳.
 *
 * 글줄이 1200px 보다 길어지면 읽는 눈이 줄을 놓친다. 화면마다 `max-w-*` 를
 * 손으로 적으면 값이 조금씩 어긋나므로, 폭이 필요한 화면은 이 컴포넌트로 감싼다.
 * 지도처럼 화면을 꽉 채워야 하는 화면은 감싸지 않는다.
 */
export function PageContainer({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-6 lg:px-8 ${className}`}>{children}</div>
  );
}
