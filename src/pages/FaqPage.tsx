import { ChevronDown, Mail } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { buttonClass } from '@/shared/components/ui/class-names';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useSettings } from '@/shared/i18n/use-settings';
import { FAQ } from './content/faq';

/**
 * 자주 묻는 질문.
 *
 * 문답은 `content/faq.ts` 에 6개 국어로 둔다. 2026-09-20 까지는 탭 이름과 문답이 한국어로만
 * 박혀 있어 어떤 언어를 골라도 한글이 나왔다(T-030 검사). 탭은 이름이 아니라 **번호(0·1)** 로
 * 고른다 — 언어를 바꿔도 열어 둔 탭이 유지되도록.
 */

/** 번역 오류·성지 정보 오류를 신고할 창구가 없다는 피드백(2026-09-07)에 대한 답. */
const CONTACT_EMAIL = 'visitholykorea@gmail.com';

export default function FaqPage() {
  const { language, t } = useSettings();
  const content = FAQ[language];

  const [tabIndex, setTabIndex] = useState<0 | 1>(0);
  // 열린 질문은 탭 안의 순번으로 기억한다 — 문구는 언어마다 달라서 키가 될 수 없다.
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title={t('faqPageTitle')} sub={t('faqPageSub')} />

      <div>
        {/* 탭 */}
        <div
          className="mb-6 flex overflow-hidden rounded-lg border border-app-border bg-white"
          role="tablist"
        >
          {content.tabs.map((tab, i) => (
            <button
              key={tab}
              role="tab"
              aria-selected={tabIndex === i}
              onClick={() => {
                setTabIndex(i as 0 | 1);
                setOpenIndex(null);
              }}
              className={`min-h-12 flex-1 px-2 text-base font-bold transition-colors ${
                tabIndex === i
                  ? 'bg-brand-blue text-white'
                  : 'bg-white text-app-text-muted hover:bg-app-bg'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 아코디언 */}
        <div className="space-y-3">
          {content.items[tabIndex].map(({ q, a }, i) => {
            const open = openIndex === i;
            return (
              <div key={q} className="overflow-hidden rounded-lg border border-app-border bg-white">
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-app-bg"
                >
                  <span className="flex items-start gap-3">
                    <span className="font-bold text-brand-blue" aria-hidden>
                      Q
                    </span>
                    <span className="text-base font-bold text-app-text">{q}</span>
                  </span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-app-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>
                {open && (
                  <p className="whitespace-pre-line border-t border-app-border bg-app-bg px-5 py-4 text-base leading-relaxed text-app-text">
                    {a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Card className="mt-10 text-center">
          <p className="text-lg font-bold text-app-text">{t('contactSectionTitle')}</p>
          <p className="mx-auto mt-2 max-w-md text-base leading-relaxed text-app-text-muted">
            {t('contactSectionBody')}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('[Visit Holy Korea] ')}`}
            className={buttonClass({ className: 'mt-5' })}
          >
            <Mail size={18} aria-hidden />
            {t('contactEmailCta')}
          </a>
          <p className="mt-3 text-sm text-app-text-muted" translate="no">
            {CONTACT_EMAIL}
          </p>
        </Card>
      </div>
    </PageContainer>
  );
}
