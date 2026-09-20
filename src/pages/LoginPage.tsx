import { ChevronDown, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import {
  signInWithEmail,
  signInWithNaver,
  signInWithOAuth,
  signUpWithEmail,
} from '@/features/auth/api/auth';
import { HAS_ANY_SOCIAL, isSocialEnabled } from '@/features/auth/lib/providers';
import { BackButton } from '@/shared/components/ui/BackButton';
import { Button } from '@/shared/components/ui/Button';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { useSettings } from '@/shared/i18n/use-settings';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import naverIcon from '@/features/auth/assets/social/naver.svg';
import kakaoIcon from '@/features/auth/assets/social/kakao.svg';
import googleIcon from '@/features/auth/assets/social/google.svg';

export default function LoginPage() {
  const navigate = useNavigate();
  const { t, language } = useSettings();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [emailAuthOpen, setEmailAuthOpen] = useState(false);
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

    if (password !== passwordConfirmation) {
      setLoading(false);
      setMessage({ type: 'error', text: t('passwordMismatch') });
      return;
    }

    const { data, error } = await signUpWithEmail(email, password, name, language);
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
          <h1 className="mb-2 whitespace-pre-line font-display text-[1.625rem] leading-tight text-app-text lg:text-3xl">
            {isLogin ? t('loginWelcomeBack') : t('signupTitle')}
          </h1>
          <p className="whitespace-pre-line text-base leading-relaxed text-app-text-muted">
            {isLogin ? t('loginWelcomeBackSub') : t('signupSub')}
          </p>
        </div>

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

        {/* 소셜 로그인 — 투어원패스처럼 안내 문구 + 원형 아이콘 가로 배열.
            네이버(Edge Function)·카카오·구글(Supabase 등록) 3사 지원. */}
        <div className="mt-10 text-center">
          {/* 2026-09-19: 네이버·카카오·구글 3사는 Supabase 등록(카카오·구글) 및
              naver-auth Edge Function 배포(네이버)가 끝나 ENABLED_SOCIAL_PROVIDERS 에
              추가됐다. 각 버튼은 isSocialEnabled(provider) 로 개별 노출되므로,
              아직 등록되지 않은 페이스북은 자동으로 숨겨진다(죽은 버튼 방지). */}
          {HAS_ANY_SOCIAL && (
            <>
              <div className="mb-6 flex items-center gap-4" aria-hidden>
                <span className="h-px flex-1 bg-app-panel" />
                <span className="text-xs font-bold text-app-text-muted">{t('socialLogin')}</span>
                <span className="h-px flex-1 bg-app-panel" />
              </div>
              <p className="mb-6 text-base text-app-text-muted">{t('socialLoginHint')}</p>

              <div className="flex items-center justify-center gap-5">
                {isSocialEnabled('naver') && (
                  <button
                    type="button"
                    onClick={() => signInWithNaver()}
                    disabled={loading}
                    aria-label={fillPlaceholders(t('loginWith'), { provider: t('providerNaver') })}
                    title={fillPlaceholders(t('loginWith'), { provider: t('providerNaver') })}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#03C75A] transition-[filter] hover:brightness-95 disabled:opacity-50"
                  >
                    <img src={naverIcon} width={20} height={20} alt="" aria-hidden />
                  </button>
                )}

                {isSocialEnabled('kakao') && (
                  <button
                    type="button"
                    onClick={() => handleOAuth('kakao')}
                    disabled={loading}
                    aria-label={fillPlaceholders(t('loginWith'), { provider: t('providerKakao') })}
                    title={fillPlaceholders(t('loginWith'), { provider: t('providerKakao') })}
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] transition-[filter] hover:brightness-95 disabled:opacity-50"
                  >
                    <img src={kakaoIcon} width={26} height={26} alt="" aria-hidden />
                  </button>
                )}

                {isSocialEnabled('google') && (
                  <button
                    type="button"
                    onClick={() => handleOAuth('google')}
                    disabled={loading}
                    aria-label={fillPlaceholders(t('loginWith'), { provider: 'Google' })}
                    title={fillPlaceholders(t('loginWith'), { provider: 'Google' })}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-app-border bg-white transition-colors hover:bg-app-bg disabled:opacity-50"
                  >
                    <img src={googleIcon} width={24} height={24} alt="" aria-hidden />
                  </button>
                )}

                {/* 페이스북은 아직 Supabase 미등록 — isSocialEnabled('facebook') 이 false 라 자동으로 숨겨진다.
                    등록 후 features/auth/lib/providers.ts 의 ENABLED_SOCIAL_PROVIDERS 에 추가하면 노출된다. */}
                {isSocialEnabled('facebook') && (
                  <button
                    type="button"
                    onClick={() => handleOAuth('facebook')}
                    disabled={loading}
                    aria-label={fillPlaceholders(t('loginWith'), {
                      provider: t('providerFacebook'),
                    })}
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
                )}
              </div>
            </>
          )}
        </div>

        <section
          className="mt-10 border-t border-app-border pt-6"
          aria-labelledby="email-auth-heading"
        >
          <button
            type="button"
            onClick={() => setEmailAuthOpen((open) => !open)}
            className="flex min-h-14 w-full items-center justify-between rounded-lg border border-app-border bg-app-bg px-4 text-left transition-colors hover:bg-app-panel"
            aria-expanded={emailAuthOpen}
            aria-controls="email-auth-panel"
          >
            <span>
              <span id="email-auth-heading" className="block text-base font-bold text-app-text">
                {t('emailAuth')}
              </span>
            </span>
            <ChevronDown
              size={22}
              aria-hidden
              className={`shrink-0 text-app-text-muted transition-transform ${
                emailAuthOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {emailAuthOpen && (
            <div id="email-auth-panel" className="mt-5">
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
                    {showPassword ? (
                      <EyeOff size={20} aria-hidden />
                    ) : (
                      <Eye size={20} aria-hidden />
                    )}
                  </button>
                </div>

                {!isLogin && (
                  <div className="group relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-app-text-muted transition-colors group-focus-within:text-brand-blue"
                      size={20}
                    />
                    <input
                      type="password"
                      name="passwordConfirmation"
                      placeholder={t('passwordConfirmation')}
                      aria-label={t('passwordConfirmation')}
                      autoComplete="new-password"
                      required
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                )}

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

                <Button
                  type="submit"
                  block
                  disabled={loading || (!isLogin && !agreed)}
                  className="mt-8 min-h-14 text-lg"
                >
                  {loading ? t('processing') : isLogin ? t('login') : t('signup')}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage(null);
                  }}
                  className="min-h-11 rounded-lg px-3 text-base font-bold text-app-text-muted transition-colors hover:bg-app-bg"
                >
                  {isLogin ? t('noAccountYet') : t('alreadyHaveAccount')}
                  <span className="text-brand-blue">{isLogin ? t('signup') : t('login')}</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 약관·개인정보·FAQ 는 새 창으로 — 같은 창에서 이동하면 입력하던 이메일·비밀번호·동의가 사라진다(재기획 §12) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
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
      </div>
    </PageContainer>
  );
}
