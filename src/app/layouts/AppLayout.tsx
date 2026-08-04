import { Monitor, Smartphone } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useSettings } from '@/shared/i18n/use-settings';
import { BottomNav } from './BottomNav';

/**
 * 모바일 폭을 기준으로 한 앱 셸.
 * 데스크톱 브라우저에서도 실제 앱과 같은 비율로 보이도록 가운데 정렬한다.
 */
export function AppLayout() {
  const { wideView, setWideView } = useSettings();
  const widthClass = wideView ? 'max-w-4xl' : 'max-w-lg';

  return (
    <div className="min-h-screen bg-gray-200">
      <div
        className={`relative ${widthClass} mx-auto mb-16 min-h-screen bg-gray-50 font-sans text-gray-900 transition-[max-width] duration-300 selection:bg-indigo-100 md:shadow-2xl`}
      >
        <Outlet />
        <BottomNav widthClass={widthClass} />
      </div>

      {/* 개발·검수용 미리보기 폭 전환. 실제 서비스 기능이 아니다. */}
      <button
        onClick={() => setWideView(!wideView)}
        className="fixed bottom-4 right-4 z-[999] flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl transition-colors hover:bg-gray-700"
        id="preview-width-toggle"
        title={wideView ? '모바일 화면으로 보기' : '넓은 화면으로 보기'}
        aria-label={wideView ? '모바일 화면으로 보기' : '넓은 화면으로 보기'}
      >
        {wideView ? <Smartphone size={20} /> : <Monitor size={20} />}
      </button>
    </div>
  );
}
