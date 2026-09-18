import { LogOut, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { signOut } from '@/features/auth/api/auth';
import { useSession } from '@/features/auth/hooks/use-session';
import { Button, ButtonLink } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 계정 설정 — 더보기 맨 위 프로필 카드의 톱니바퀴 단추 (2026-09-18).
 *
 * 이름·비밀번호를 직접 고치는 기능은 아직 없다. 없는 기능을 누르면 되는 것처럼
 * 보여주지 않는다(더미 UI 금지 원칙) — 지금 가진 값만 정직하게 보여주고,
 * 준비 중임을 그대로 적는다. 로그아웃만 실제로 작동한다.
 */
export default function AccountPage() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { session } = useSession();

  const displayName =
    (session?.user.user_metadata?.name as string | undefined) ||
    session?.user.email ||
    t('pilgrimDefaultName');
  const email = session?.user.email ?? null;

  const handleLogout = async () => {
    await signOut();
    navigate(paths.home);
  };

  if (!session) {
    return (
      <PageContainer width="narrow" className="min-h-page pb-16">
        <PageHeader back={{ to: paths.menu, label: t('moreTab') }} title={t('accountSettings')} />
        <EmptyState
          icon={User}
          title={t('recordsLoginTitle')}
          description={t('recordsMinimalSub')}
          action={
            <ButtonLink to={paths.login} id="account-login-btn">
              {t('login')}
            </ButtonLink>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      <PageHeader back={{ to: paths.menu, label: t('moreTab') }} title={t('accountSettings')} />

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-blue">
            <User size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-app-text-muted">{t('accountNameLabel')}</p>
            <p className="truncate text-base font-bold text-app-text">{displayName}</p>
          </div>
        </div>
        {email && (
          <div className="flex items-center gap-3 border-t border-app-border pt-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-blue">
              <Mail size={18} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-app-text-muted">{t('accountEmailLabel')}</p>
              <p className="truncate text-base font-bold text-app-text">{email}</p>
            </div>
          </div>
        )}
      </Card>

      <p className="mt-4 text-sm leading-relaxed text-app-text-muted">
        {t('accountEditPending')}
      </p>

      <Button variant="ghost" block className="mt-8" onClick={() => void handleLogout()}>
        <LogOut size={18} aria-hidden />
        {t('logout')}
      </Button>
    </PageContainer>
  );
}
