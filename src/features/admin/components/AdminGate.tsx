import { KeyRound, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmail, signOut } from '@/features/auth/api/auth';
import { paths } from '@/app/routes/paths';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';
import { useAdminAccess } from '../hooks/use-admin';

/**
 * 관리자 화면의 문지기.
 *
 * 순례자용 로그인(`/login`)과 화면을 나눈 이유는 두 가지다.
 * 하나는 성격이 달라서 — 여기는 소셜 로그인도, 회원가입도 없다.
 * 다른 하나는 실수를 줄이려고 — 순례자 화면으로 튕겼다가 돌아오면
 * 현장에서 사진 한 장 올리는 데 화면을 세 번 옮겨야 한다.
 *
 * **이 문지기는 눈속임이다.** 화면을 감출 뿐, 실제 차단은 DB 의 RLS 정책이 한다.
 * 이 컴포넌트를 통과해도 권한이 없으면 저장이 서버에서 거절된다.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { canEnter, isLoading, isLoggedIn, role } = useAdminAccess();

  if (isLoading) return <LoadingSpinner />;
  if (!isLoggedIn) return <AdminLoginForm />;
  if (!canEnter) return <NoPermission role={role} />;

  return <>{children}</>;
}

function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signInError } = await signInWithEmail(email, password);
    setLoading(false);
    if (signInError) {
      // 관리자 화면에서는 "계정이 있는지"까지 알려 주지 않는다.
      setError('이메일 또는 비밀번호가 맞지 않습니다.');
    }
    // 성공하면 useSession 이 바뀌면서 AdminGate 가 알아서 다음 화면을 그린다.
  };

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-base font-bold text-slate-900 focus:border-slate-900 focus:outline-none';

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-8">
      <div className="mb-8">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <KeyRound size={26} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">관리자 로그인</h1>
        <p className="mt-2 text-sm font-medium leading-relaxed text-slate-500">
          성지 사진과 안내글을 고치는 화면입니다.
          <br />
          순례자 계정으로는 들어올 수 없습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            autoComplete="username"
            required
            className={inputClass}
          />
        </div>
        <div className="relative">
          <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="px-1 text-sm font-bold text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-2xl bg-slate-900 py-4 text-base font-bold text-white disabled:opacity-50"
        >
          {loading ? '확인 중…' : '로그인'}
        </button>
      </form>

      <Link
        to={paths.home}
        className="mt-8 text-center text-sm font-bold text-slate-400 underline underline-offset-4"
      >
        앱으로 돌아가기
      </Link>
    </div>
  );
}

function NoPermission({ role }: { role: string }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-8 text-center">
      <ShieldAlert size={40} className="text-slate-300" />
      <h1 className="text-lg font-black text-slate-900">관리자 권한이 없는 계정입니다</h1>
      <p className="text-sm font-medium leading-relaxed text-slate-500">
        지금 로그인한 계정의 등급은 「{role}」 입니다.
        <br />
        권한이 필요하면 운영자에게 요청하세요.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={() => void signOut()}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700"
        >
          다른 계정으로 로그인
        </button>
        <Link
          to={paths.home}
          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white"
        >
          앱으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
