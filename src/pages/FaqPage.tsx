import { ChevronDown, Mail } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/shared/components/ui/Card';
import { buttonClass } from '@/shared/components/ui/class-names';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FAQ, type FaqTab } from '@/shared/content/legal/faq';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 자주 묻는 질문.
 *
 * 투어원패스 고객센터(pass.knto.or.kr/faq)의 구성을 참고했다 —
 * 탭 2개(회원가입 및 로그인 / 서비스 이용) + 아코디언.
 * 문답은 `shared/content/legal/faq.ts` 에 6개 국어로 있다 — 이 화면은 그리기만 한다.
 */

/** 번역 오류·성지 정보 오류를 신고할 창구가 없다는 피드백(2026-09-07)에 대한 답. */
const CONTACT_EMAIL = 'visitholykorea@gmail.com';

export default function FaqPage() {
  const { t, language } = useSettings();
  const tabs = FAQ[language];

  const [selectedTab, setSelectedTab] = useState<FaqTab['id']>('account');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const currentItems = tabs.find((tab) => tab.id === selectedTab)?.items ?? [];

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title={t('faqPageTitle')} sub={t('faqPageSub')} />

      <div>
        {/* 탭 */}
        <div
          className="mb-6 flex overflow-hidden rounded-lg border border-app-border bg-white"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selectedTab === tab.id}
              onClick={() => {
                setSelectedTab(tab.id);
                setOpenIndex(null);
              }}
              className={`min-h-12 flex-1 px-2 text-base font-bold transition-colors ${
                selectedTab === tab.id
                  ? 'bg-brand-blue text-white'
                  : 'bg-white text-app-text-muted hover:bg-app-bg'
              }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        {/* 아코디언 */}
        <div className="space-y-3">
          {currentItems.map(({ q, a }, index) => {
            const open = openIndex === index;
            return (
              <div key={q} className="overflow-hidden rounded-lg border border-app-border bg-white">
                <button
                  onClick={() => setOpenIndex(open ? null : index)}
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
