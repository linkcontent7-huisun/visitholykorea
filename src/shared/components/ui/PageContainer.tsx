import type { ReactNode } from 'react';

/**
 * 본문 폭과 좌우 여백을 정하는 유일한 곳 (2026-09-17 화면 규칙).
 *
 * - 좌우 여백은 **모바일 20px · PC 32px** — 상단바의 로고·돋보기와 같은 선에 맞춘다.
 *   화면마다 px-4·px-6·px-8 이 섞여 있어 화면을 옮길 때마다 본문이 좌우로 움찔거렸다.
 * - 폭은 두 가지뿐이다. `default`(1200px)는 카드 격자처럼 넓게 펼치는 화면,
 *   `narrow`(768px)는 글을 읽거나 양식을 채우는 화면. 글줄이 이보다 길어지면 눈이 줄을 놓친다.
 *   예전의 `wideView ? max-w-4xl : max-w-lg` 분기는 이 두 값으로 흡수했다.
 * - 지도처럼 화면을 꽉 채워야 하는 화면은 감싸지 않는다.
 */
export function PageContainer({
  children,
  className = '',
  width = 'default',
}: {
  children: ReactNode;
  className?: string;
  width?: 'default' | 'narrow';
}) {
  const maxWidth = width === 'narrow' ? 'max-w-3xl' : 'max-w-[1200px]';
  return <div className={`mx-auto w-full ${maxWidth} px-5 lg:px-8 ${className}`}>{children}</div>;
}
