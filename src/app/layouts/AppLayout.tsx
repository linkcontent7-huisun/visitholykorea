import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TravelProfileSheet } from '@/features/auth/components/TravelProfileSheet';
import { useTravelProfilePrompt } from '@/features/auth/hooks/use-travel-profile-prompt';
import { useSettings } from '@/shared/i18n/use-settings';
import { BottomNav } from './BottomNav';

/**
 * 모바일 폭을 기준으로 한 앱 셸.
 * 데스크톱 브라우저에서도 실제 앱과 같은 비율로 보이도록 가운데 정렬한다.
 *
 * 폭 전환 버튼이 화면 오른쪽 아래에 떠 있었는데, 휴대폰에서 하단 탭의 `더보기` 를
 * 가려 누를 수 없게 만들었다(2026-09-05 실기기 확인). 개발·검수용 도구였을 뿐
 * 사용자가 고를 일이 아니므로 지웠다 — 이제 화면 폭으로 자동 판단한다.
 */
export function AppLayout() {
  const { wideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  // 서버가 "물어본 적 없다"고 답한 세션에서만 뜬다. 시트를 닫으면(답했든 건너뛰었든)
  // 서버에도 표시가 남으므로, 여기서는 다시 안 뜨게만 로컬로 즉시 숨긴다.
  const shouldPrompt = useTravelProfilePrompt();
  const [dismissed, setDismissed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-200">
      <div
        className={`relative ${widthClass} mx-auto mb-16 min-h-screen bg-gray-50 font-sans text-gray-900 transition-[max-width] duration-300 selection:bg-indigo-100 md:shadow-2xl`}
      >
        <Outlet />
        <BottomNav widthClass={widthClass} />
        <TravelProfileSheet isOpen={shouldPrompt && !dismissed} onClose={() => setDismissed(true)} />
      </div>
    </div>
  );
}
