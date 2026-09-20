import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useSettings } from '@/shared/i18n/use-settings';
import { PRIVACY } from './content/privacy';

/**
 * 개인정보 안내.
 *
 * 본문은 `content/privacy.ts` 에 6개 국어로 둔다. 2026-09-20 까지는 ko/en 둘뿐이라
 * 스페인어 이용자가 영어를 봤다(T-030 검사) — 언어 설정을 그대로 따른다.
 * 한국어가 원문이므로 다른 언어에는 "번역본이며 한국어본이 우선" 을 밝힌다.
 */
export default function PrivacyPage() {
  const { language, t } = useSettings();
  const content = PRIVACY[language];

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title={content.title} />

      {language !== 'ko' && (
        <p className="mb-6 text-sm leading-relaxed text-app-text-muted">
          {t('legalTranslationNote')}
        </p>
      )}

      <div className="mt-2">
        {content.items.map((item) => (
          <article key={item.title} className="mb-8">
            <h2 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold text-app-text">
              {item.title}
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-app-text-muted">
              {item.body}
            </p>
          </article>
        ))}
      </div>
    </PageContainer>
  );
}
