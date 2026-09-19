import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/api/supabase';

interface SessionState {
  session: Session | null;
  isLoading: boolean;
}

/**
 * 현재 로그인 세션을 구독한다. 로그인·로그아웃이 일어나면 자동으로 갱신된다.
 *
 * 소셜 로그인은 다른 창(안드로이드 PWA 의 크롬 탭, 카카오톡 안 브라우저)에서 끝나는 일이 잦다.
 * 그 창이 세션을 저장해도 **원래 앱 창은 아무 이벤트도 못 받아** 로그인 버튼이 그대로 남는다
 * (2026-09-19 "간헐적으로 로그인이 안 된다"의 정체). 그래서 창이 다시 보일 때·초점을 받을 때·
 * 다른 창이 저장소를 바꿨을 때 세션을 다시 읽는다.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => {
    let active = true;

    const sync = () => {
      void supabase.auth.getSession().then(({ data }) => {
        if (active) setState({ session: data.session, isLoading: false });
      });
    };
    sync();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setState({ session: newSession, isLoading: false });
    });

    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    const onStorage = (e: StorageEvent) => {
      // supabase-js 는 `sb-<ref>-auth-token` 키에 세션을 둔다
      if (e.key === null || e.key.startsWith('sb-')) sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', sync);
    window.addEventListener('storage', onStorage);

    return () => {
      active = false;
      listener.subscription.unsubscribe();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return state;
}
