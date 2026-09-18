import { Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TextSize } from './settings-context';
import { useSettings } from './use-settings';

/** 고를 수 있는 두 단계 — 「소」는 뺐다(사장님 지적, 2026-09-18). 「중」이던 값이 이제
 *  기본값이자 유일한 "작은 쪽" 선택지라, 라벨도 「기본」으로 바꿨다. */
const PICKABLE_SIZES: readonly TextSize[] = ['md', 'lg'];

/**
 * 글자 크기 고르기 — 「가」 버튼을 누르면 아래로 대·기본 두 개가 세로로 펼쳐지고,
 * 하나를 고르면 바로 적용되고 접힌다 (2026-09-12 사장님 요청).
 * 처음엔 옆으로 소·중·대였는데, 휴대폰에서 상단바가 비좁아 세로 목록으로 바꾸고
 * 큰 글자를 맨 위에 뒀다 — 주 사용자가 고르는 것이 「대」라서 (2026-09-13).
 *
 * 왜 켬/끔 토글이 아닌가 — 118% 한 단계는 누구에게는 모자라고 누구에게는 과했다.
 * 60대 이상이 주 사용자라 "조금 더"와 "훨씬 더"를 고를 수 있어야 한다.
 *
 * `inline` 은 설정 화면용 — 펼침 없이 두 개가 늘 보인다.
 *
 * `variant="onDark"` — 헤더가 사진 위에 투명하게 뜰 때(홈, `TopNav`). 평소 상태(글자 크기 「기본」)만
 * 흰 배경 대신 반투명 검정 칩 + 흰 글자로 바꾼다. 펼친 목록은 사진 위에서도 늘 흰 배경이라 그대로 둔다.
 */
export function TextSizePicker({
  inline = false,
  variant = 'default',
}: {
  inline?: boolean;
  variant?: 'default' | 'onDark';
}) {
  const { t, textSize, setTextSize } = useSettings();
  const [open, setOpen] = useState(inline);
  const rootRef = useRef<HTMLDivElement>(null);

  // 바깥을 누르면 접는다 — 열어 둔 채 다른 곳을 만지면 화면을 가린다.
  useEffect(() => {
    if (inline || !open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [inline, open]);

  const labels: Record<TextSize, string> = {
    sm: t('textSizeSmall'),
    md: t('textSizeMedium'),
    lg: t('textSizeLarge'),
  };

  const choose = (size: TextSize) => {
    setTextSize(size);
    if (!inline) setOpen(false);
  };

  return (
    <div ref={rootRef} className={inline ? 'flex items-center' : 'relative'}>
      {!inline && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          // 상단바의 세 단추(돋보기·글자 크기·언어)는 같은 44px 테두리 상자다. 글자 크기를 키워 둔 상태만 남색으로 채운다.
          className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-lg border-[1.5px] transition-colors ${
            textSize === 'lg'
              ? 'border-brand-blue bg-brand-blue text-white'
              : variant === 'onDark'
                ? 'border-white/40 bg-black/30 text-white backdrop-blur-md hover:bg-black/45'
                : 'border-app-border bg-white text-brand-blue hover:bg-app-bg'
          }`}
          id="text-size-toggle"
          aria-label={t('textSizeButton')}
          aria-expanded={open}
          aria-controls="text-size-options"
        >
          <Type size={20} aria-hidden />
        </button>
      )}

      {open && (
        <div
          id="text-size-options"
          role="radiogroup"
          aria-label={t('textSizeButton')}
          className={
            inline
              ? 'flex items-center gap-[2px] rounded-lg border border-app-border bg-white p-[2px]'
              : 'absolute right-0 top-[calc(100%+6px)] z-50 flex w-[76px] flex-col gap-[2px] rounded-lg border border-app-border bg-white p-[3px] shadow-lg shadow-black/10'
          }
        >
          {/* 펼침일 때는 큰 것부터 — 위에서 아래로 대·기본 */}
          {(inline ? PICKABLE_SIZES : [...PICKABLE_SIZES].reverse()).map((size) => {
            // 예전 「소」를 저장해 둔 사람도 "기본" 이 골라진 것으로 보이게 한다 —
            // 고르는 자리에 「소」가 없으니 대가 아니면 전부 기본으로 본다.
            const active = size === 'md' ? textSize !== 'lg' : size === textSize;
            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(size)}
                className={`rounded-lg px-[10px] text-[14px] font-bold leading-none transition-colors ${
                  inline ? 'min-h-[40px] min-w-[44px]' : 'min-h-[44px]'
                } ${
                  active ? 'bg-brand-blue text-white' : 'text-app-text-muted hover:text-brand-blue'
                }`}
                id={`text-size-${size}`}
              >
                {labels[size]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
