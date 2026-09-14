import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 제출 범위에서 뺀 기능의 옛 주소로 들어온 사람에게 보여주는 안내.
 *
 *   /ai-guide — AI 순례 가이드(미카엘). 출처 표시·정확성 검수·오류 신고·비용 한도가
 *               갖춰지기 전까지 공개하지 않는다(재기획 2026-09-14). 코드와 Edge Function 은 남아 있다.
 *   /compass  — 마음 나침반 8문항. 성지 찾기의 조건(마음 상태·출발 지역·이동 조건)으로 흡수했다.
 *
 * 404 로 보내지 않는 이유 — 밖에 퍼진 링크·북마크로 온 사람이 "앱이 죽었다"고 느끼지 않게,
 * 무엇으로 대신할 수 있는지를 말하고 성지 찾기로 이어 준다.
 */
export default function RetiredFeaturePage({ feature }: { feature: 'ai' | 'compass' }) {
  const { t } = useSettings();
  const title = feature === 'ai' ? t('retiredAiTitle') : t('retiredCompassTitle');
  const body = feature === 'ai' ? t('retiredAiBody') : t('retiredCompassBody');

  return (
    <PageContainer className="min-h-page py-12">
      <div className="mx-auto max-w-lg rounded-[28px] border border-app-border bg-white p-8 text-center">
        <h1 className="text-xl font-extrabold tracking-tight text-app-text">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-app-text-muted">{body}</p>
        <Link
          to={paths.search}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-blue px-6 text-sm font-bold text-white"
          id="retired-go-search"
        >
          <Search size={16} aria-hidden />
          {t('goToFindShrines')}
        </Link>
      </div>
    </PageContainer>
  );
}
