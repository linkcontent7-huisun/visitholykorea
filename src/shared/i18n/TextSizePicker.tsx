import { Type } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TEXT_SIZES, type TextSize } from './settings-context';
import { useSettings } from './use-settings';

/**
 * 글자 크기 고르기 — 「가」 버튼을 누르면 옆에 소·중·대 세 개가 나란히 펼쳐지고,
 * 하나를 고르면 바로 적용되고 접힌다 (2026-09-12 사장님 요청).
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

  // 펼친 동안 문서에 표시를 남긴다 — 상단바가 이걸 보고 검색 안내 글씨를 잠시 감춰
  // 휴대폰 폭에서 소·중·대가 오른쪽으로 밀려 잘리지 않게 한다.
  useEffect(() => {
    if (inline) return;
    if (open) document.documentElement.setAttribute('data-text-size-open', '');
    else document.documentElement.removeAttribute('data-text-size-open');
    return () => document.documentElement.removeAttribute('data-text-size-open');
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
    <div ref={rootRef} className="flex items-center gap-[6px]">
      {!inline && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full transition-colors ${
            textSize !== 'sm' ? 'bg-brand-blue text-white' : 'bg-app-border text-app-text-muted'
          }`}
          id="text-size-toggle"
          aria-label={t('textSizeButton')}
          aria-expanded={open}
          aria-controls="text-size-options"
        >
          <Type size={15} />
        </button>
      )}

      {open && (
        <div
          id="text-size-options"
          role="radiogroup"
          aria-label={t('textSizeButton')}
          className="flex items-center gap-[2px] rounded-full border border-app-border bg-white p-[2px]"
        >
          {TEXT_SIZES.map((size) => {
            const active = size === textSize;
            return (
              <button
                key={size}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(size)}
                className={`min-w-[34px] rounded-full px-[10px] py-[6px] text-[13px] font-bold leading-none transition-colors ${
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
