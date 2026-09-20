import { Check, Globe } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ENABLED_LANGUAGES, LANGUAGE_LABEL, LANGUAGE_SHORT, type Language } from './dictionary';
import { useSettings } from './use-settings';

/**
 * 언어 선택 드롭다운.
 *
 * 목록은 `ENABLED_LANGUAGES`(2026-09-20 부터 여섯 개 전부 — 2027 서울 세계청년대회
 * 공식 언어 넷 es·fr·pt·it 포함). 목록의 이름은
 * **각자의 언어로** 적는다 — 스페인어 순례자에게 "스페인어"라고 한글로 써 두면
 * 자기 언어를 찾을 수가 없다.
 *
 * 헤더의 좁은 자리에 들어가므로 평소에는 코드(KO·EN…)만 보이고, 누르면 펼친다.
 *
 * `variant="onDark"` — 헤더가 사진 위에 투명하게 뜰 때(홈, `TopNav`). 토글 단추만 흰 배경 대신
 * 반투명 검정 칩 + 흰 글자로 바꾼다. 펼친 목록은 사진 위에서도 늘 흰 배경이라 그대로 둔다.
 *
 * 키보드: 열리면 현재 언어로 포커스, ↑↓·Home·End 로 이동, Esc 로 닫고 토글로 돌아간다
 * (2026-09-21 접근성 감사 후속). `li` 는 `role="none"` — listbox 와 option 사이에 listitem 이
 * 끼면 스크린리더가 「목록 6개 항목」으로 읽거나 option 을 건너뛴다.
 */
const OPTION_SELECTOR = '[role="option"]';
export function LanguagePicker({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'onDark';
}) {
  const { language, setLanguage } = useSettings();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // 열리면 현재 언어 항목으로 포커스 — 키보드 사용자가 Tab 을 여섯 번 누르지 않게
  useEffect(() => {
    if (!open) return;
    const selected = listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    (selected ?? listRef.current?.querySelector<HTMLElement>(OPTION_SELECTOR))?.focus();
  }, [open]);

  // 목록을 열어둔 채 다른 곳을 누르려던 사람을 가로막지 않는다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const choose = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
    toggleRef.current?.focus();
  };

  // ↑↓·Home·End — 목록 안에서만 돈다(끝에서 처음으로)
  const onListKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>(OPTION_SELECTOR) ?? []);
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next: number | null = null;
    if (e.key === 'ArrowDown') next = (current + 1) % items.length;
    else if (e.key === 'ArrowUp') next = (current - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next === null) return;
    e.preventDefault();
    items[next]?.focus();
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        // 영어 화면에서 「EN」·「Log in」이 두 줄로 꺾여 단추가 깨졌다(2026-09-17) — 상단바 단추는 줄바꿈도 줄어듦도 없다
        className={
          variant === 'onDark'
            ? 'flex h-[44px] shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border-[1.5px] border-white/40 bg-black/30 px-[10px] text-[14px] font-bold text-white backdrop-blur-md transition-colors hover:bg-black/45 focus-visible:outline-white'
            : 'flex h-[44px] shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border-[1.5px] border-app-border bg-white px-[10px] text-[14px] font-bold text-brand-blue transition-colors hover:bg-app-bg'
        }
        id="language-toggle"
        // 보이는 글자(KO)가 접근성 이름에 들어가야 한다 — Lighthouse label-content-name-mismatch (9/14)
        aria-label={`${LANGUAGE_SHORT[language]} · 언어 / Language — ${LANGUAGE_LABEL[language]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={16} aria-hidden />
        {LANGUAGE_SHORT[language]}
      </button>

      {open && (
        <ul
          ref={listRef}
          onKeyDown={onListKeyDown}
          role="listbox"
          aria-label="언어 / Language"
          className="absolute right-0 top-full z-50 mt-2 min-w-[9rem] overflow-hidden rounded-lg border border-app-border bg-white py-1 shadow-xl"
        >
          {ENABLED_LANGUAGES.map((lang) => {
            const selected = lang === language;
            return (
              <li key={lang} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(lang)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 whitespace-nowrap px-4 text-left text-base transition-colors ${
                    selected
                      ? 'font-extrabold text-brand-blue'
                      : 'font-medium text-app-text hover:bg-app-bg'
                  }`}
                >
                  {LANGUAGE_LABEL[lang]}
                  {selected && <Check size={16} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
