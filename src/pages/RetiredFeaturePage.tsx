import { Search } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { ButtonLink } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 제출 범위에서 뺀 기능의 옛 주소로 들어온 사람에게 보여주는 안내.
 *
 *   /ai-guide — AI 순례 가이드(미카엘). 출처 표시·정확성 검수·오류 신고·비용 한도가
 *               갖춰지기 전까지 공개하지 않는다(재기획 2026-09-14). 코드와 Edge Function 은 남아 있다.
 *
 * 404 로 보내지 않는 이유 — 밖에 퍼진 링크·북마크로 온 사람이 "앱이 죽었다"고 느끼지 않게,
 * 무엇으로 대신할 수 있는지를 말하고 성지 찾기로 이어 준다.
 */
export default function RetiredFeaturePage({ feature }: { feature: 'ai' }) {
  const { t } = useSettings();
  void feature; // 지금은 AI 가이드뿐 — 나침반은 「오늘의 성지 일정」으로 돌아왔다 (2026-09-15)
  const title = t('retiredAiTitle');
  const body = t('retiredAiBody');

  return (
    <PageContainer width="narrow" className="min-h-page py-12">
      <Card>
        <EmptyState
          compact
          title={<h1>{title}</h1>}
          description={body}
          action={
            <ButtonLink to={paths.search} id="retired-go-search">
              <Search size={18} aria-hidden />
              {t('goToFindShrines')}
            </ButtonLink>
          }
        />
      </Card>
    </PageContainer>
  );
}
