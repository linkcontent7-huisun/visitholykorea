import { useEffect, useState } from 'react';
import { getTravelProfile } from '@/features/auth/api/travel-profile';
import { useSession } from './use-session';

/**
 * 로그인한 사용자에게 여행 프로필 시트를 "딱 한 번" 보여줘야 하는지 판단한다.
 *
 * 이메일 가입은 메일 인증을 거쳐야 세션이 생기고, 소셜 로그인은 콜백을 거쳐
 * 홈으로 돌아온다 — 그래서 "가입 버튼 누른 직후"에 딱 붙일 화면이 없다.
 * 대신 로그인 세션이 잡힐 때마다 "물어본 적 있는지"를 서버에 물어서 판단한다.
 * (2026-09-05: 첫 배치는 이 자리로 정했지만, 응답률을 보고 다른 시점으로
 *  옮길 수 있다 — travel-profile-onboarding-placement 메모리 참고)
 */
export function useTravelProfilePrompt(): boolean {
  const { session, isLoading } = useSession();
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isLoading || !session) {
      setShouldShow(false);
      return;
    }

    let active = true;
    void getTravelProfile().then((profile) => {
      if (active) setShouldShow(profile !== null && profile.promptedAt === null);
    });

    return () => {
      active = false;
    };
  }, [isLoading, session]);

  return shouldShow;
}
