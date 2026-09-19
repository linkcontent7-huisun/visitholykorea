import { Compass } from 'lucide-react';
import { paths } from '@/app/routes/paths';
import { ButtonLink } from '@/shared/components/ui/Button';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { useSettings } from '@/shared/i18n/use-settings';

export default function NotFoundPage() {
  const { t } = useSettings();
  return (
    <PageContainer
      width="narrow"
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <EmptyState
        icon={Compass}
        title={<h1>{t('notFoundTitle')}</h1>}
        description={t('notFoundBody')}
        action={<ButtonLink to={paths.home}>{t('backToHome')}</ButtonLink>}
      />
    </PageContainer>
  );
}
