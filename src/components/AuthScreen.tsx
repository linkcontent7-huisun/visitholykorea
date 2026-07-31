import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';

interface AuthScreenProps {
  onSuccess: () => void;
  onBack: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onBack }) => {
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
        return;
      }
      onSuccess();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      setLoading(false);
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      alert('가입 확인 메일을 보냈어요. 메일함을 확인해주세요.');
      setIsLogin(true);
    }
  };

  return (
    <div className={`fixed inset-y-0 left-1/2 -translate-x-1/2 w-full ${widthClass} z-[300] bg-white flex flex-col animate-in slide-in-from-right duration-300`}>
      <div className="h-16 flex items-center px-4 shrink-0">
        <button onClick={onBack} className="p-2 text-slate-800">
          <ChevronLeft size={28} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-10">
        <div className="mt-10 mb-12">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-100">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 whitespace-pre-line">
            {isLogin ? '다시 오신 것을\n환영합니다' : '거룩한 여정의\n시작'}
          </h1>
          <p className="text-slate-400 font-medium whitespace-pre-line">
            {isLogin ? '순례의 기록을 계속 이어가세요.' : '회원가입을 통해 본인만의\n순례 일정을 관리해보세요.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
              />
            </div>
          )}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={20} />
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
            />
          </div>

          {errorMsg && <p className="text-red-500 text-sm font-bold px-1">{errorMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group hover:bg-blue-700 transition-all active:scale-95 mt-8 disabled:opacity-50"
          >
            {loading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-10 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-slate-400">
            {isLogin ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
            <span className="text-blue-600"> {isLogin ? '회원가입' : '로그인'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
