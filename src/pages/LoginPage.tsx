import { ArrowRight, ChevronLeft, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmail,
  signInWithNaver,
  signInWithOAuth,
  signUpWithEmail,
} from '@/features/auth/api/auth';
import { useSettings } from '@/shared/i18n/use-settings';

export default function LoginPage() {
  const navigate = useNavigate();
  const { wideView, t } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
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
          text: 미확인
            ? t('signupMailPending')
            : t('loginBadCredentials'),
        });
        return;
      }
      navigate(-1);
      return;
    }

    const { error } = await signUpWithEmail(email, password, name);
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
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
    'w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 pl-12 pr-4 font-bold transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  return (
    <div className={`mx-auto flex min-h-screen ${widthClass} flex-col bg-white`}>
      <div className="flex h-16 shrink-0 items-center px-4">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-800" aria-label="뒤로 가기">
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="mb-12 mt-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-100">
            <ShieldCheck size={32} />
          </div>
          <h1 className="mb-2 whitespace-pre-line text-3xl font-black tracking-tight text-slate-900">
            {isLogin ? t('loginWelcomeBack') : t('signupTitle')}
          </h1>
          <p className="whitespace-pre-line font-medium text-slate-400">
            {isLogin
              ? t('loginWelcomeBackSub')
              : t('signupSub')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="group relative">
              <UserIcon
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-500"
                size={20}
              />
              <input
                type="text"
                placeholder="이름"
                aria-label="이름"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div className="group relative">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-500"
              size={20}
            />
            <input
              type="email"
              placeholder="이메일 주소"
              aria-label="이메일 주소"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="group relative">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-blue-500"
              size={20}
            />
            <input
              type="password"
              placeholder="비밀번호"
              aria-label="비밀번호"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          {message && (
            <p
              className={`px-1 text-sm font-bold ${
                message.type === 'error' ? 'text-red-500' : 'text-blue-600'
              }`}
              role="status"
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-5 font-black text-white shadow-xl shadow-blue-100 transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-50"
          >
            {loading ? t('processing') : isLogin ? t('login') : t('signup')}
            {!loading && (
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </form>

        {/* 소셜 로그인 — 투어원패스처럼 안내 문구 + 원형 아이콘 가로 배열.
            Supabase 공식 지원 제공자(카카오·구글)만 놓는다. 네이버는 미지원이라 뺐다. */}
        <div className="mt-10 text-center">
          <div className="mb-6 flex items-center gap-4" aria-hidden>
            <span className="h-px flex-1 bg-slate-100" />
            <span className="text-xs font-bold text-slate-300">{t('socialLogin')}</span>
            <span className="h-px flex-1 bg-slate-100" />
          </div>
          <p className="mb-6 text-sm font-medium text-slate-400">
            {t('socialLoginHint')}
          </p>

          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => signInWithNaver()}
              disabled={loading}
              aria-label="네이버로 로그인"
              title="네이버로 로그인"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#03C75A] shadow-md transition-all hover:brightness-95 active:scale-95 disabled:opacity-50"
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
              aria-label="카카오로 로그인"
              title="카카오로 로그인"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FEE500] shadow-md transition-all hover:brightness-95 active:scale-95 disabled:opacity-50"
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
              aria-label="Google로 로그인"
              title="Google로 로그인"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
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
              aria-label="페이스북으로 로그인"
              title="페이스북으로 로그인"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] shadow-md transition-all hover:brightness-95 active:scale-95 disabled:opacity-50"
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

          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => navigate('/terms')}
              className="text-xs font-bold text-slate-400 underline underline-offset-2"
            >
              {t('viewTerms')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/faq')}
              className="text-xs font-bold text-slate-400 underline underline-offset-2"
            >
              {t('viewFaq')}
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-slate-400">
            {isLogin ? t('noAccountYet') : t('alreadyHaveAccount')}
            <span className="text-blue-600">{isLogin ? t('signup') : t('login')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
