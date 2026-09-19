/**
 * 버튼·카드·칩의 클래스 문자열만 따로 둔다.
 *
 * `<a>`·`<label>`·`<Link>` 처럼 컴포넌트를 못 쓰는 자리에서도 같은 생김새를 내기 위해서다.
 * 컴포넌트 파일에서 함께 export 하면 Vite 빠른 새로고침(react-refresh)이 그 파일을 통째로
 * 다시 그리므로 여기로 분리했다. 규칙 설명은 각 컴포넌트 파일(Button·Card·Chip)에 있다.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'neutral' | 'ghost';
export type ButtonSize = 'md' | 'sm';

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-blue text-white hover:bg-brand-blue/90',
  secondary: 'border-[1.5px] border-brand-blue bg-white text-brand-blue hover:bg-brand-soft',
  neutral: 'border border-app-border bg-white text-app-text hover:bg-app-bg',
  ghost: 'text-app-text-muted hover:bg-app-bg hover:text-app-text',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  md: 'min-h-12 px-5 text-base',
  sm: 'min-h-11 px-4 text-sm',
};

export function buttonClass({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}): string {
  return [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-bold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-50',
    BUTTON_VARIANT[variant],
    BUTTON_SIZE[size],
    block ? 'flex w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export type CardTone = 'white' | 'panel' | 'dashed' | 'soft';

const CARD_TONE: Record<CardTone, string> = {
  white: 'border border-app-border bg-white',
  panel: 'border border-app-border bg-app-bg',
  dashed: 'border border-dashed border-app-border bg-white',
  soft: 'bg-brand-soft',
};

export function cardClass(tone: CardTone = 'white', padded = true, className = ''): string {
  return `rounded-lg ${CARD_TONE[tone]} ${padded ? 'p-5' : ''} ${className}`.trim();
}

export function chipClass(active: boolean, className = ''): string {
  return `inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-bold transition-colors ${
    active
      ? 'border-brand-blue bg-brand-blue text-white'
      : 'border-app-border bg-white text-app-text hover:border-brand-blue/50'
  } ${className}`.trim();
}
