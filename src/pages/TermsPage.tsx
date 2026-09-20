import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { TERMS } from './content/terms';

/**
 * 이용약관.
 *
 * 본문은 `content/terms.ts` 에 6개 국어로 둔다. 2026-09-20 까지는 제목만 번역되고 본문은
 * 한국어뿐이라 외국인 이용자가 읽을 수 없었다(T-030 검사). 한국어가 원문이므로
 * 다른 언어에는 "번역본이며 한국어본이 우선" 을 밝힌다.
 */
export default function TermsPage() {
  const { language, t } = useSettings();
  const content = TERMS[language];

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader
        back
        title={t('termsPageTitle')}
        sub={fillPlaceholders(t('termsEffectiveDate'), { date: content.effectiveDate })}
      />

      {language !== 'ko' && (
        <p className="mb-6 text-sm leading-relaxed text-app-text-muted">
          {t('legalTranslationNote')}
        </p>
      )}

      <div className="mt-2">
        {content.chapters.map((chapter) => (
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
