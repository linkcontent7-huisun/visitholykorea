import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

/**
 * 버튼 한 벌 (2026-09-17 화면 규칙).
 *
 * 화면마다 알약(rounded-full)·모서리 8px·그림자 붙은 것이 섞여 있어 같은 뜻의 버튼이
 * 화면마다 다르게 보였다. 이제 **모서리 8px 하나**, 그림자 없음, 높이는 두 가지다.
 *
 * - `primary`   남색 채움 — 화면에서 가장 중요한 행동 하나
 * - `secondary` 남색 테두리 — 그 다음 행동
 * - `neutral`   회색 테두리 — 취소·다시 시도처럼 눈에 띄지 않아도 되는 행동
 * - `ghost`     테두리 없음 — 「나중에」「접기」 같은 가벼운 글자 버튼
 *
 * 높이 `md` 48px 이 기본이다. 50대 이상이 엄지로 누르는 화면이라 44px 보다 여유를 둔다.
 * `sm` 44px 은 카드 안에 나란히 놓는 작은 버튼용 — 이보다 작은 누름 영역은 만들지 않는다.
 *
 * 클래스 문자열만 필요하면(`<a href>`·`<label>`) `class-names.ts` 의 `buttonClass` 를 쓴다.
 */
import { buttonClass, type ButtonSize, type ButtonVariant } from './class-names';

interface ButtonOwnProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** 가로로 꽉 채운다 — 양식 아래 「저장」처럼 */
  block?: boolean;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant,
  size,
  block,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonOwnProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'>) {
  return (
    <button type={type} className={buttonClass({ variant, size, block, className })} {...rest}>
      {children}
    </button>
  );
}

/** 같은 생김새의 이동용 링크. 행동은 `<button>`, 이동은 `<a>` — 가운데 버튼·새 탭 열기가 살아야 한다. */
export function ButtonLink({
  variant,
  size,
  block,
  className,
  children,
  ...rest
}: ButtonOwnProps & Omit<LinkProps, 'className' | 'children'>) {
  return (
    <Link className={buttonClass({ variant, size, block, className })} {...rest}>
      {children}
    </Link>
  );
}
