import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { TERMS } from '@/shared/content/legal/terms';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 이용약관.
 *
 * 본문은 `shared/content/legal/terms.ts` 에 6개 국어로 있다 — 이 화면은 그리기만 한다.
 * 개인정보 처리의 구체적인 항목·기간·삭제 방법은 별도 개인정보 안내에 둔다.
 */
export default function TermsPage() {
  const { t, language } = useSettings();
  const terms = TERMS[language];
  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader
        back
        title={t('termsPageTitle')}
        sub={fillPlaceholders(t('termsEffectiveDate'), { date: terms.effectiveDate })}
      />

      <div className="mt-2">
        {terms.chapters.map((chapter) => (
          <section key={chapter.title} className="mb-10">
            <h2 className="mb-4 border-b border-app-border pb-2 text-lg font-bold text-app-text">
              {chapter.title}
            </h2>
            {chapter.articles.map((article) => (
              <article key={article.title} className="mb-6">
                <h3 className="mb-2 text-base font-bold text-app-text">{article.title}</h3>
                <p className="whitespace-pre-line text-base leading-relaxed text-app-text-muted">
                  {article.body}
                </p>
              </article>
            ))}
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
