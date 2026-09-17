import { Check, Globe } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ENABLED_LANGUAGES, LANGUAGE_LABEL, LANGUAGE_SHORT, type Language } from './dictionary';
import { useSettings } from './use-settings';

/**
 * 언어 선택 드롭다운.
 *
 * 지금은 검수를 마친 한국어·영어만 보인다(`ENABLED_LANGUAGES`). 2027 서울 세계청년대회
 * 공식 언어 넷(es·fr·pt·it)은 사전은 있으나 검수 전이라 숨긴다. 목록의 이름은
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
        className="flex h-[44px] cursor-pointer items-center gap-1 rounded-lg border-[1.5px] border-app-border bg-white px-[10px] text-[14px] font-bold text-brand-blue transition-colors hover:bg-app-bg"
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
          role="listbox"
          aria-label="언어 / Language"
          className="absolute right-0 top-full z-50 mt-2 min-w-[9rem] overflow-hidden rounded-lg border border-app-border bg-white py-1 shadow-xl"
        >
          {ENABLED_LANGUAGES.map((lang) => {
            const selected = lang === language;
            return (
              <li key={lang}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => choose(lang)}
                  className={`flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left text-base transition-colors ${
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
