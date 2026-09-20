import { LogOut, Mail, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import {
  deleteMyAccount,
  hasEmailPassword,
  signOut,
  updateMyName,
  updateMyPassword,
} from '@/features/auth/api/auth';
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
 * 이름 바꾸기·비밀번호 바꾸기(이메일 가입자만)·로그아웃·계정 삭제가 실제로 동작한다
 * (2026-09-21 — 그전엔 「준비 중」이라고만 적혀 있었다). 카카오·구글·네이버 계정은
 * 비밀번호가 없으므로 그 칸을 그리지 않는다(없는 기능을 보여 주지 않는 원칙).
 */
const inputClass =
  'min-h-14 w-full rounded-lg border border-app-input-border bg-white px-4 text-base font-bold text-app-text transition-colors focus:border-brand-blue';
const labelClass = 'mb-1.5 mt-4 block text-sm font-bold text-app-text';

export default function AccountPage() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { session } = useSession();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [nameInput, setNameInput] = useState<string | null>(null);
  const [nameNotice, setNameNotice] = useState<'saved' | 'failed' | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordNotice, setPasswordNotice] = useState<
    'changed' | 'mismatch' | 'weak' | 'failed' | null
  >(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const displayName =
    (session?.user.user_metadata?.name as string | undefined) ||
    session?.user.email ||
    t('pilgrimDefaultName');
  const email = session?.user.email ?? null;

  const currentName = (session?.user.user_metadata?.name as string | undefined) ?? '';
  const draftName = nameInput ?? currentName;
  const canSaveName = draftName.trim().length > 0 && draftName.trim() !== currentName;
  const canChangePassword = hasEmailPassword(session?.user);

  const handleSaveName = async () => {
    if (!canSaveName) return;
    setSavingName(true);
    setNameNotice(null);
    const result = await updateMyName(draftName);
    setNameNotice(result.success ? 'saved' : 'failed');
    if (result.success) setNameInput(null);
    setSavingName(false);
  };

  const handleChangePassword = async () => {
    if (password.length < 6) {
      setPasswordNotice('weak');
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordNotice('mismatch');
      return;
    }
    setSavingPassword(true);
    setPasswordNotice(null);
    const result = await updateMyPassword(password);
    setPasswordNotice(result.success ? 'changed' : 'failed');
    if (result.success) {
      setPassword('');
      setPasswordConfirm('');
    }
    setSavingPassword(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate(paths.home);
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(t('accountDeleteConfirm'));
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
      window.alert(t('accountDeleteDone'));
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

      {/* 이름 바꾸기 — 라벨은 눈에 보이게 칸 위에(WCAG 3.3.2) */}
      <section
        className="mt-8 border-t border-app-border pt-6"
        aria-labelledby="account-name-heading"
      >
        <h2 id="account-name-heading" className="text-lg font-bold text-app-text">
          {t('accountNameTitle')}
        </h2>
        <p className="mt-1 text-sm text-app-text-muted">{t('accountNameHint')}</p>
        <label htmlFor="account-name-input" className={labelClass}>
          {t('nameField')}
        </label>
        <input
          id="account-name-input"
          type="text"
          autoComplete="name"
          maxLength={40}
          value={draftName}
          onChange={(e) => {
            setNameInput(e.target.value);
            setNameNotice(null);
          }}
          className={inputClass}
        />
        {nameNotice && (
          <p
            role="status"
            className={`mt-2 text-sm ${nameNotice === 'saved' ? 'text-app-text-muted' : 'text-red-700'}`}
          >
            {nameNotice === 'saved' ? t('accountNameSaved') : t('accountNameFailed')}
          </p>
        )}
        <Button
          variant="neutral"
          block
          className="mt-3"
          onClick={() => void handleSaveName()}
          disabled={savingName || !canSaveName}
          id="account-name-save"
        >
          {t('accountSave')}
        </Button>
      </section>

      {/* 비밀번호 바꾸기 — 이메일로 가입한 계정에만 있다 */}
      {canChangePassword && (
        <section
          className="mt-8 border-t border-app-border pt-6"
          aria-labelledby="account-password-heading"
        >
          <h2 id="account-password-heading" className="text-lg font-bold text-app-text">
            {t('accountPasswordTitle')}
          </h2>
          <label htmlFor="account-password-new" className={labelClass}>
            {t('accountPasswordNew')}
          </label>
          <input
            id="account-password-new"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordNotice(null);
            }}
            className={inputClass}
          />
          <label htmlFor="account-password-confirm" className={labelClass}>
            {t('accountPasswordConfirm')}
          </label>
          <input
            id="account-password-confirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => {
              setPasswordConfirm(e.target.value);
              setPasswordNotice(null);
            }}
            className={inputClass}
          />
          {passwordNotice && (
            <p
              role={passwordNotice === 'changed' ? 'status' : 'alert'}
              className={`mt-2 text-sm ${passwordNotice === 'changed' ? 'text-app-text-muted' : 'text-red-700'}`}
            >
              {passwordNotice === 'changed' && t('accountPasswordChanged')}
              {passwordNotice === 'mismatch' && t('passwordMismatch')}
              {passwordNotice === 'weak' && t('signupWeakPassword')}
              {passwordNotice === 'failed' && t('accountPasswordFailed')}
            </p>
          )}
          <Button
            variant="neutral"
            block
            className="mt-3"
            onClick={() => void handleChangePassword()}
            disabled={savingPassword || !password || !passwordConfirm}
            id="account-password-save"
          >
            {t('accountPasswordTitle')}
          </Button>
        </section>
      )}

      <Button variant="ghost" block className="mt-8" onClick={() => void handleLogout()}>
        <LogOut size={18} aria-hidden />
        {t('logout')}
      </Button>

      <div className="mt-8 border-t border-app-border pt-6">
        <h2 className="text-lg font-bold text-app-text">{t('accountDeleteTitle')}</h2>
        <p className="mt-2 text-base leading-relaxed text-app-text-muted">
          {t('accountDeleteBody')}
        </p>
        {deleteError && (
          <p role="alert" className="mt-3 text-base text-red-700">
            {t('accountDeleteError')}
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
          {deleting ? t('accountDeleting') : t('accountDeleteTitle')}
        </Button>
      </div>
    </PageContainer>
  );
}
