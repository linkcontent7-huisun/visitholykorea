import { Compass } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { ButtonLink } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';

export default function NotFoundPage() {
  return (
    <PageContainer
      width="narrow"
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <EmptyState
        icon={Compass}
        title={<h1>길을 찾을 수 없습니다</h1>}
        description="요청하신 페이지가 없거나 주소가 바뀌었어요."
        action={<ButtonLink to={paths.home}>홈으로 돌아가기</ButtonLink>}
      />
    </PageContainer>
  );
}
