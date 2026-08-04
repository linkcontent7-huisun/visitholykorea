import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '@/shared/api/supabase';

interface SessionState {
  session: Session | null;
  isLoading: boolean;
}

/** 현재 로그인 세션을 구독한다. 로그인·로그아웃이 일어나면 자동으로 갱신된다. */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setState({ session: data.session, isLoading: false });
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setState({ session: newSession, isLoading: false });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return state;
}
