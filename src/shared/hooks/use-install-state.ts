import { useEffect, useState } from 'react';
import {
  getInstallState,
  subscribeInstallState,
  type InstallState,
} from '@/shared/lib/install-prompt';

/** 설치 상태를 구독한다. beforeinstallprompt 가 늦게 오거나 설치가 끝나면 다시 계산한다. */
export function useInstallState(): InstallState {
  const [state, setState] = useState<InstallState>(() => getInstallState());
  useEffect(() => {
    setState(getInstallState());
    const off = subscribeInstallState(() => setState(getInstallState()));
    // 데스크톱은 설치된 앱 창과 브라우저 탭을 오가므로 display-mode 변화도 본다 (정의서 5장 비고)
    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = () => setState(getInstallState());
    mq.addEventListener?.('change', onChange);
    return () => {
      off();
      mq.removeEventListener?.('change', onChange);
    };
  }, []);
  return state;
}
