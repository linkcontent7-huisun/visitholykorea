import { Check, Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, LANGUAGE_LABEL, LANGUAGE_SHORT, type Language } from './dictionary';
import { useSettings } from './use-settings';

/**
 * 언어 선택 드롭다운.
 *
 * 2027 서울 세계청년대회(WYD) 공식 언어 6개를 고를 수 있다. 목록의 이름은
 * **각자의 언어로** 적는다 — 스페인어 순례자에게 "스페인어"라고 한글로 써 두면
 * 자기 언어를 찾을 수가 없다.
 *
 * 헤더의 좁은 자리에 들어가므로 평소에는 코드(KO·EN…)만 보이고, 누르면 펼친다.
 */
export function LanguagePicker({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useSettings();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 목록을 열어둔 채 다른 곳을 누르려던 사람을 가로막지 않는다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
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
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex cursor-pointer items-center gap-1 text-[13px] font-bold text-app-text-muted"
        id="language-toggle"
        aria-label={`언어 / Language — ${LANGUAGE_LABEL[language]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe size={14} aria-hidden />
        {LANGUAGE_SHORT[language]}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="언어 / Language"
          className="absolute right-0 top-full z-50 mt-2 min-w-[9rem] overflow-hidden rounded-2xl border border-app-border bg-white py-1 shadow-xl"
        >
          {LANGUAGES.map((lang) => {
            const selected = lang === language;
            return (
              <li key={lang}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(lang)}
                  className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                    selected
                      ? 'font-extrabold text-brand-violet'
                      : 'font-medium text-app-text hover:bg-app-bg'
                  }`}
                >
                  {LANGUAGE_LABEL[lang]}
                  {selected && <Check size={14} aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
