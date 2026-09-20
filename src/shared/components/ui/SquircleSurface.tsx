import { type ComponentPropsWithoutRef, type ElementType, type ReactNode, type Ref } from 'react';
import { SquircleBorder } from './SquircleBorder';
import { useSquircle } from './use-squircle';

type SquircleSurfaceProps<T extends ElementType> = {
  as?: T;
  radius?: number;
  borderColor?: string;
  borderWidth?: number;
  borderDashed?: boolean;
  borderClassName?: string;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className' | 'style'>;

/**
 * 카드·사진·입력 묶음처럼 면적이 큰 사각형에 같은 스쿼클 곡선을 적용한다.
 *
 * `border-radius` 만 키우면 원호가 커질 뿐이라 모서리가 여전히 딱 꺾여 보인다.
 * 실제 크기로 초타원 경로를 계산하고, CSS 테두리 대신 같은 경로를 SVG 로 그려
 * 반응형 너비에서도 바깥선과 곡선이 어긋나지 않게 한다.
 *
 * 작은 아이콘 버튼은 모양 차이보다 누름 영역이 더 중요해 이 부품을 쓰지 않는다.
 */
export function SquircleSurface<T extends ElementType = 'div'>({
  as,
  radius = 12,
  borderColor,
  borderWidth = 1,
  borderDashed = false,
  borderClassName = '',
  className = '',
  children,
  ...rest
}: SquircleSurfaceProps<T>) {
  const { ref, style, overlay } = useSquircle<HTMLElement>(radius);
  const Component: ElementType = as ?? 'div';

  return (
    <Component
      ref={ref as Ref<HTMLElement>}
      style={style}
      className={`relative ${className}`.trim()}
      {...rest}
    >
      {children}
      {borderColor && overlay && (
        <SquircleBorder
          path={overlay.path}
          width={overlay.width}
          height={overlay.height}
          color={borderColor}
          strokeWidth={borderWidth}
          dashed={borderDashed}
          className={borderClassName}
        />
      )}
    </Component>
  );
}
