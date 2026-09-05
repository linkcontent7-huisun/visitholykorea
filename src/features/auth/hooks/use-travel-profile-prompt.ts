import { useEffect, useState } from 'react';
import { getTravelProfile } from '@/features/auth/api/travel-profile';
import { useSession } from './use-session';

/**
 * 로그인한 사용자에게 여행 프로필 시트를 "딱 한 번" 보여줘야 하는지 판단한다.
 *
 * 이메일 가입은 메일 인증을 거쳐야 세션이 생기고, 소셜 로그인은 콜백을 거쳐
 * 홈으로 돌아온다 — 그래서 "가입 버튼 누른 직후"에 딱 붙일 화면이 없다.
 * 대신 로그인 세션이 잡힐 때마다 "물어본 적 있는지"를 서버에 물어서 판단한다.
 *
 * TODO(2026-09-05, 재검토 예정): "가입 직후"는 사용자가 셋 중 골라본 첫 선택지일
 * 뿐, 검증된 최적 시점이 아니다. 완료율/스킵율이 쌓이면 "첫 스탬프 찍을 때"
 * 등 다른 시점으로 옮기는 걸 다시 검토하기로 사용자와 합의했다.
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
