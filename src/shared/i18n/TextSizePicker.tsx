import { Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TEXT_SIZES, type TextSize } from './settings-context';
import { useSettings } from './use-settings';

/**
 * 글자 크기 고르기 — 「가」 버튼을 누르면 아래로 대·중·소 세 개가 세로로 펼쳐지고,
 * 하나를 고르면 바로 적용되고 접힌다 (2026-09-12 사장님 요청).
 * 처음엔 옆으로 소·중·대였는데, 휴대폰에서 상단바가 비좁아 세로 목록으로 바꾸고
 * 큰 글자를 맨 위에 뒀다 — 주 사용자가 고르는 것이 「대」라서 (2026-09-13).
 *
 * 왜 켬/끔 토글이 아닌가 — 118% 한 단계는 누구에게는 모자라고 누구에게는 과했다.
 * 60대 이상이 주 사용자라 "조금 더"와 "훨씬 더"를 고를 수 있어야 한다.
 *
 * `inline` 은 설정 화면용 — 펼침 없이 세 개가 늘 보인다.
 */
export function TextSizePicker({ inline = false }: { inline?: boolean }) {
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
            textSize !== 'sm'
              ? 'border-brand-blue bg-brand-blue text-white'
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
          {/* 펼침일 때는 큰 것부터 — 위에서 아래로 대·중·소 */}
          {(inline ? TEXT_SIZES : [...TEXT_SIZES].reverse()).map((size) => {
            const active = size === textSize;
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
