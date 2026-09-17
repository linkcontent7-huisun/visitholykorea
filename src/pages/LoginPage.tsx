import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import {
  signInWithEmail,
  signInWithNaver,
  signInWithOAuth,
  signUpWithEmail,
} from '@/features/auth/api/auth';
import { HAS_ANY_SOCIAL } from '@/features/auth/lib/providers';
import { BackButton } from '@/shared/components/ui/BackButton';
import { Button } from '@/shared/components/ui/Button';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { useSettings } from '@/shared/i18n/use-settings';
import { fillPlaceholders } from '@/shared/i18n/dictionary';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useSettings();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'info'; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await signInWithEmail(email, password);
      setLoading(false);
      if (error) {
        // 미확인 계정과 잘못된 비밀번호는 안내가 달라야 한다 — 실제로 이 둘을 혼동해 막힌 사례가 있다.
        const 미확인 = `${error.message}`.toLowerCase().includes('not confirmed');
        setMessage({
          type: 'error',
          text: 미확인 ? t('signupMailPending') : t('loginBadCredentials'),
        });
        return;
      }
      navigate(-1);
      return;
    }

    if (!agreed) {
      setLoading(false);
      return;
    }

    const { data, error } = await signUpWithEmail(email, password, name);
    setLoading(false);
    if (error) {
      // 상태를 구분해 안내한다(재기획 §12): 기존 계정 / 약한 비밀번호 / 일시 오류 — 원문 영어 메시지를 그대로 보여주지 않는다.
      const msg = error.message.toLowerCase();
      if (
        msg.includes('already') ||
        msg.includes('registered') ||
        (error.status === 422 && msg.includes('exist'))
      ) {
        setMessage({ type: 'error', text: t('signupExisting') });
        setIsLogin(true);
      } else if (msg.includes('password')) {
        setMessage({ type: 'error', text: t('signupWeakPassword') });
      } else {
        setMessage({ type: 'error', text: `${t('signupTemporaryError')} · ${t('signupContact')}` });
      }
      return;
    }
    // Supabase 는 이미 가입된 이메일로 다시 가입해도 오류 대신 identities 가 빈 사용자를 돌려준다.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setMessage({ type: 'error', text: t('signupExisting') });
      setIsLogin(true);
      return;
    }
    // 세션이 바로 오면 이메일 확인이 꺼진 설정 — "가입 완료". 없으면 인증 메일 발송 → 인증 대기.
    if (data.session) {
      setMessage({ type: 'info', text: t('signupDone') });
      navigate(-1);
      return;
    }
    setMessage({ type: 'info', text: t('signupMailSent') });
    setIsLogin(true);
  };

  /** 소셜 로그인 — 성공하면 Supabase 콜백을 거쳐 이 앱으로 돌아온다. */
  const handleOAuth = async (provider: 'google' | 'kakao' | 'facebook') => {
    setMessage(null);
    setLoading(true);
    const { error } = await signInWithOAuth(provider);
    if (error) {
      setLoading(false);
      setMessage({
        type: 'error',
        text: t('socialLoginFailed'),
      });
    }
    // 성공 시에는 제공자 페이지로 이동하므로 여기서 할 일이 없다.
  };

  const inputClass =
    'min-h-14 w-full rounded-lg border border-app-border bg-white pl-12 pr-4 text-base font-bold text-app-text transition-colors focus:border-brand-blue';

  return (
    <PageContainer width="narrow" className="flex min-h-screen flex-col bg-white pb-10">
      <div className="pt-4">
        <BackButton />
      </div>

      <div className="flex-1">
        <div className="mb-10 mt-8">
          <div
            className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-brand-blue text-white"
            aria-hidden
          >
            <ShieldCheck size={32} />
          </div>
          <h1 className="mb-2 whitespace-pre-line font-display text-[1.625rem] leading-tight text-app-text lg:text-3xl">
            {isLogin ? t('loginWelcomeBack') : t('signupTitle')}
          </h1>
          <p className="whitespace-pre-line text-base leading-relaxed text-app-text-muted">
            {isLogin ? t('loginWelcomeBackSub') : t('signupSub')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="group relative">
              <UserIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted transition-colors group-focus-within:text-brand-blue"
                size={20}
              />
              <input
                type="text"
                name="name"
                placeholder={t('nameField')}
                aria-label={t('nameField')}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div className="group relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted transition-colors group-focus-within:text-brand-blue"
              size={20}
            />
            <input
              type="email"
              name="email"
              inputMode="email"
              spellCheck={false}
              placeholder={t('emailField')}
              aria-label={t('emailField')}
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="group relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted transition-colors group-focus-within:text-brand-blue"
              size={20}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder={t('passwordField')}
              aria-label={t('passwordField')}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-14`}
            />
            {/* 비밀번호 보기 — 브라우저 기본 기능이 아니다(Chrome·Safari 에 없음). 오타로 로그인에 실패하는
                50대 이상 사용자를 위해 둔다 (2026-09-16 회의). */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-bg hover:text-brand-blue"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              aria-pressed={showPassword}
              id="toggle-password"
            >
              {showPassword ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
            </button>
          </div>

          {!isLogin && (
            <label className="flex min-h-11 cursor-pointer items-start gap-3 px-1 text-sm text-app-text-muted">
              <input
                type="checkbox"
                name="agreed"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-brand-blue"
              />
              <span>{t('signupConsentLabel')}</span>
            </label>
          )}

          {message && (
            <p
              className={`px-1 text-base font-bold ${
                message.type === 'error' ? 'text-red-600' : 'text-brand-blue'
              }`}
              role="status"
              aria-live="polite"
            >
              {message.text}
            </p>
          )}

          <Button
            type="submit"
            block
            disabled={loading || (!isLogin && !agreed)}
            className="mt-8 min-h-14 text-lg"
          >
            {loading ? t('processing') : isLogin ? t('login') : t('signup')}
            {!loading && <ArrowRight size={20} aria-hidden />}
          </Button>
        </form>

        {/* 소셜 로그인 — 투어원패스처럼 안내 문구 + 원형 아이콘 가로 배열.
            Supabase 공식 지원 제공자(카카오·구글)만 놓는다. 네이버는 미지원이라 뺐다. */}
        <div className="mt-10 text-center">
          {/* 켜진 제공자가 있을 때만 그린다. 2026-09-04 실측에서 카카오·구글·
              페이스북·네이버 넷 다 죽어 있었고, 누르면 앱을 떠나 오류 JSON
              화면으로 갔다 — 사용자 눈에는 "앱이 멈췄다"로 보인다.
              작동하지 않는 버튼은 더미 UI 다. 제공자를 켠 뒤
              features/auth/lib/providers.ts 목록에 추가하면 되살아난다. */}
          {HAS_ANY_SOCIAL && (
            <>
              <div className="mb-6 flex items-center gap-4" aria-hidden>
                <span className="h-px flex-1 bg-app-panel" />
                <span className="text-xs font-bold text-app-text-muted">{t('socialLogin')}</span>
                <span className="h-px flex-1 bg-app-panel" />
              </div>
              <p className="mb-6 text-base text-app-text-muted">{t('socialLoginHint')}</p>

              <div className="flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => signInWithNaver()}
                  disabled={loading}
                  aria-label={fillPlaceholders(t('loginWith'), { provider: t('providerNaver') })}
                  title={fillPlaceholders(t('loginWith'), { provider: t('providerNaver') })}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#03C75A] transition-[filter] hover:brightness-95 disabled:opacity-50"
                >
                  {/* 네이버 N 심볼 */}
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#fff" d="M15.1 4v8.2L8.9 4H4v16h4.9v-8.2l6.2 8.2H20V4h-4.9Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('kakao')}
                  disabled={loading}
                  aria-label={fillPlaceholders(t('loginWith'), { provider: t('providerKakao') })}
                  title={fillPlaceholders(t('loginWith'), { provider: t('providerKakao') })}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] transition-[filter] hover:brightness-95 disabled:opacity-50"
                >
                  {/* 카카오 말풍선 심볼 */}
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      fill="#191919"
                      d="M12 3C6.9 3 2.8 6.2 2.8 10.1c0 2.5 1.7 4.7 4.2 6l-1 3.8c-.1.3.3.6.6.4l4.4-2.9c.3 0 .7.1 1 .1 5.1 0 9.2-3.2 9.2-7.3S17.1 3 12 3Z"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  aria-label={fillPlaceholders(t('loginWith'), { provider: 'Google' })}
                  title={fillPlaceholders(t('loginWith'), { provider: 'Google' })}
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-app-border bg-white transition-colors hover:bg-app-bg disabled:opacity-50"
                >
                  {/* 구글 G 심볼 */}
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.2v3.1C3.2 21.3 7.3 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.2C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4.1-3.1Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.7c1.8 0 3.3.6 4.6 1.8L20 3C18 1.1 15.2 0 12 0 7.3 0 3.2 2.7 1.2 6.6l4.1 3.1c.9-2.9 3.6-5 6.7-5Z"
                    />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('facebook')}
                  disabled={loading}
                  aria-label={fillPlaceholders(t('loginWith'), { provider: t('providerFacebook') })}
                  title={fillPlaceholders(t('loginWith'), { provider: t('providerFacebook') })}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] transition-[filter] hover:brightness-95 disabled:opacity-50"
                >
                  {/* 페이스북 f 심볼 */}
                  <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
                    <path
                      fill="#fff"
                      d="M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6h1.7V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3v3.2h2.8V21h3.4Z"
                    />
                  </svg>
                </button>
              </div>
            </>
          )}

          {/* 약관·개인정보·FAQ 는 새 창으로 — 같은 창에서 이동하면 입력하던 이메일·비밀번호·동의가 사라진다(재기획 §12) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              to={paths.terms}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center text-sm font-bold text-app-text-muted underline underline-offset-2"
            >
              {t('viewTerms')}
            </Link>
            <Link
              to={paths.privacy}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center text-sm font-bold text-app-text-muted underline underline-offset-2"
            >
              {t('privacyNotice')}
            </Link>
            <Link
              to={paths.faq}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center text-sm font-bold text-app-text-muted underline underline-offset-2"
            >
              {t('viewFaq')}
            </Link>
          </div>
          <p className="mt-2 text-center text-sm text-app-text-muted">{t('termsOpensNewTab')}</p>
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="min-h-11 rounded-lg px-3 text-base font-bold text-app-text-muted transition-colors hover:bg-app-bg"
          >
            {isLogin ? t('noAccountYet') : t('alreadyHaveAccount')}
            <span className="text-brand-blue">{isLogin ? t('signup') : t('login')}</span>
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
