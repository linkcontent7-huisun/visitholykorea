import type { SVGProps } from 'react';

/**
 * 미카엘 순례 가이드 아이콘 — 헤드셋을 쓴 웃는 얼굴.
 *
 * 홈 카드·헤더는 별(`Sparkles`), 대화 시트 안은 로봇(`Bot`)이라 같은 가이드가 세 얼굴이었다
 * (사장님 지적, 2026-09-21). 사장님이 준 참고 그림(둥근 얼굴 + 귀덮개 + 붐 마이크)을 lucide 규격
 * (24 격자·선 2px·둥근 끝)으로 다시 그려 한 아이콘만 쓴다. `size`·`className` 은 lucide 아이콘과
 * 같은 방식이라 자리만 바꿔 끼우면 된다. 16·24·28px 로 그려 눈·입·마이크가 뭉개지지 않는지 봤다.
 */
export function MichaelIcon({
  size = 24,
  className,
  ...rest
}: { size?: number | string } & Omit<SVGProps<SVGSVGElement>, 'width' | 'height'>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {/* 얼굴 — 아래 가운데가 열려 있고 오른쪽 아래가 마이크 붐으로 이어진다 */}
      <path d="M10.5 19.5H8.5A4.5 4.5 0 0 1 4 15V9a4.5 4.5 0 0 1 4.5-4.5h7A4.5 4.5 0 0 1 20 9v6a4.5 4.5 0 0 1-2.4 4.1" />
      {/* 귀덮개 */}
      <path d="M4 10H3a1.5 1.5 0 0 0-1.5 1.5v2A1.5 1.5 0 0 0 3 15h1" />
      <path d="M20 10h1a1.5 1.5 0 0 1 1.5 1.5v2A1.5 1.5 0 0 1 21 15h-1" />
      {/* 붐 마이크 */}
      <path d="M17.6 19.1 15 21.7a1.8 1.8 0 0 1-2.6-2.5" />
      {/* 웃는 입·눈 */}
      <path d="M9 14.2c1.6 1.4 4.4 1.4 6 0" />
      <circle cx="9.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
