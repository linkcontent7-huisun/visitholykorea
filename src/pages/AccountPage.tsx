import { LogOut, Mail, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { deleteMyAccount, signOut } from '@/features/auth/api/auth';
import { useSession } from '@/features/auth/hooks/use-session';
import { clearLocalVisits } from '@/features/map/api/visited';
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
  const { t, language } = useSettings();
  const { session } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const ko = language === 'ko';

  const displayName =
    (session?.user.user_metadata?.name as string | undefined) ||
    session?.user.email ||
    t('pilgrimDefaultName');
  const email = session?.user.email ?? null;

  const handleLogout = async () => {
    await signOut();
    navigate(paths.home);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      ko
        ? '계정을 삭제하면 순례 기록, 공개 후기, 사진, 대화가 함께 삭제되며 복구할 수 없습니다. 계속할까요?'
        : 'Deleting your account also deletes your visit records, public notes, photos and chats. This cannot be undone. Continue?',
    );
    if (!confirmed) return;
    setDeleting(true);
    setDeleteError(false);
    try {
      const result = await deleteMyAccount();
      if (!result.success) {
        setDeleteError(true);
        return;
      }
      clearLocalVisits();
      window.alert(
        ko
          ? '계정과 연결 기록을 삭제했습니다.'
          : 'Your account and linked records have been deleted.',
      );
      navigate(paths.home);
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
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

      <p className="mt-4 text-sm leading-relaxed text-app-text-muted">{t('accountEditPending')}</p>

      <Button variant="ghost" block className="mt-8" onClick={() => void handleLogout()}>
        <LogOut size={18} aria-hidden />
        {t('logout')}
      </Button>

      <div className="mt-8 border-t border-app-border pt-6">
        <h2 className="text-lg font-bold text-app-text">{ko ? '계정 삭제' : 'Delete account'}</h2>
        <p className="mt-2 text-base leading-relaxed text-app-text-muted">
          {ko
            ? '계정과 연결된 순례 기록, 공개 후기, 사진, AI 대화가 삭제됩니다. 로그인이 어렵다면 visitholykorea@gmail.com으로 요청해 주세요.'
            : 'Your account, visit records, public notes, photos and AI chats will be deleted. If you cannot sign in, email visitholykorea@gmail.com.'}
        </p>
        {deleteError && (
          <p role="alert" className="mt-3 text-base text-red-700">
            {ko
              ? '삭제를 완료하지 못했습니다. 다시 시도하거나 이메일로 요청해 주세요.'
              : 'Deletion could not be completed. Try again or request it by email.'}
          </p>
        )}
        <Button
          variant="neutral"
          block
          className="mt-4"
          onClick={() => void handleDelete()}
          disabled={deleting}
          id="account-delete-btn"
        >
          <Trash2 size={18} aria-hidden />
          {deleting ? (ko ? '삭제 중…' : 'Deleting…') : ko ? '계정 삭제' : 'Delete account'}
        </Button>
      </div>
    </PageContainer>
  );
}
