import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PRIVACY } from '@/shared/content/legal/privacy';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 개인정보 안내.
 *
 * 본문은 `shared/content/legal/privacy.ts` 에 6개 국어로 있다 — 이 화면은 그리기만 한다.
 * 앱의 실제 저장·삭제 동작과 운영자가 확정한 값만 공개한다.
 */
export default function PrivacyPage() {
  const { language } = useSettings();
  const privacy = PRIVACY[language];

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back title={privacy.title} />

      <div className="mt-2">
        {privacy.sections.map((section) => (
          <article key={section.title} className="mb-8">
            <h2 className="mb-2 flex flex-wrap items-center gap-2 text-lg font-bold text-app-text">
              {section.title}
            </h2>
            <p className="whitespace-pre-line text-base leading-relaxed text-app-text-muted">
              {section.body}
            </p>
          </article>
        ))}
      </div>
    </PageContainer>
  );
}
