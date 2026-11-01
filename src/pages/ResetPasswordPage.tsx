import { Eye, EyeOff, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { updateMyPassword } from '@/features/auth/api/auth';
import { useSession } from '@/features/auth/hooks/use-session';
import { Button } from '@/shared/components/ui/Button';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 비밀번호 재설정 메일의 링크가 돌아오는 화면 (2026-11-01).
 *
 * 링크를 누르면 supabase-js 가 주소에 실린 토큰으로 **먼저 로그인시킨다** — 그래서 이 화면은
 * 「로그인된 상태에서 비밀번호 바꾸기」와 같다. 세션이 없으면 링크가 만료됐거나 이미 쓴 것이다.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { session, isLoading } = useSession();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<'weak' | 'mismatch' | 'failed' | 'changed' | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setNotice('weak');
    if (password !== passwordConfirm) return setNotice('mismatch');
    setSaving(true);
    setNotice(null);
    const { success } = await updateMyPassword(password);
    setSaving(false);
    setNotice(success ? 'changed' : 'failed');
  };

  const inputClass =
    'min-h-14 w-full rounded-lg border border-app-input-border bg-white pl-12 pr-14 text-base font-bold text-app-text transition-colors focus:border-brand-blue';
  const labelClass = 'mb-1.5 block text-sm font-bold text-app-text';
  const noticeText = {
    weak: t('signupWeakPassword'),
    mismatch: t('passwordMismatch'),
    failed: t('accountPasswordFailed'),
    changed: t('accountPasswordChanged'),
  } as const;

  return (
    <PageContainer width="narrow" className="flex min-h-screen flex-col bg-white pb-10 pt-10">
      <h1 className="mb-6 font-display text-[1.625rem] leading-tight text-app-text">
        {t('resetPasswordTitle')}
      </h1>

      {isLoading ? (
        <p className="text-base text-app-text-muted">{t('processing')}</p>
      ) : !session ? (
        <div className="space-y-6">
          <p className="text-base text-app-text" role="alert">
            {t('resetLinkExpired')}
          </p>
          <Link
            to={paths.login}
            className="inline-flex min-h-11 items-center font-bold text-brand-blue underline"
          >
            {t('backToLogin')}
          </Link>
        </div>
      ) : notice === 'changed' ? (
        <div className="space-y-6">
          <p className="text-base font-bold text-brand-blue" role="status">
            {noticeText.changed}
          </p>
          <Button block className="min-h-14 text-lg" onClick={() => navigate(paths.home)}>
            {t('backToHome')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {(
            [
              ['reset-password-new', 'accountPasswordNew', password, setPassword],
              [
                'reset-password-confirm',
                'accountPasswordConfirm',
                passwordConfirm,
                setPasswordConfirm,
              ],
            ] as const
          ).map(([id, label, value, setValue], index) => (
            <div key={id}>
              <label htmlFor={id} className={labelClass}>
                {t(label)}
              </label>
              <div className="group relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted"
                  size={20}
                  aria-hidden
                />
                <input
                  id={id}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    setNotice(null);
                  }}
                  aria-describedby={index === 0 ? 'reset-password-hint' : undefined}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-app-text-muted hover:bg-app-bg hover:text-brand-blue"
                  aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
                </button>
              </div>
              {index === 0 && (
                <p id="reset-password-hint" className="mt-2 px-1 text-sm text-app-text-muted">
                  {t('passwordHint')}
                </p>
              )}
            </div>
          ))}

          {notice && (
            <p className="font-bold text-red-600" role="alert">
              {noticeText[notice]}
            </p>
          )}

          <Button type="submit" block disabled={saving} className="mt-6 min-h-14 text-lg">
            {saving ? t('processing') : t('resetPasswordTitle')}
          </Button>
        </form>
      )}
    </PageContainer>
  );
}
