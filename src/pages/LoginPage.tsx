import { ArrowRight, ChevronLeft, Lock, Mail, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signUpWithEmail } from '@/features/auth/api/auth';
import { useSettings } from '@/shared/i18n/use-settings';

export default function LoginPage() {
  const navigate = useNavigate();
  const { wideView } = useSettings();
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
        setMessage({ type: 'error', text: '이메일 또는 비밀번호가 올바르지 않습니다.' });
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
    setMessage({ type: 'info', text: '가입 확인 메일을 보냈어요. 메일함을 확인해주세요.' });
    setIsLogin(true);
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
            {isLogin ? '다시 오신 것을\n환영합니다' : '거룩한 여정의\n시작'}
          </h1>
          <p className="whitespace-pre-line font-medium text-slate-400">
            {isLogin
              ? '순례의 기록을 계속 이어가세요.'
              : '회원가입을 통해 본인만의\n순례 일정을 관리해보세요.'}
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
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            {!loading && (
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-slate-400">
            {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <span className="text-blue-600">{isLogin ? '회원가입' : '로그인'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
