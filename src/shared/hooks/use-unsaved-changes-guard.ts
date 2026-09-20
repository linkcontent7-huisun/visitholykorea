import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * 수정 중(저장 안 함) 상태에서 화면을 벗어나려 하면 경고한다(2026-09-20 사장님 지적 —
 * 내 순례 기록 수정 중 실수로 나가면 고친 내용이 그냥 사라졌다).
 *
 * 두 가지 "벗어남"을 각각 막는다: 앱 안 이동(다른 탭 누르기 등)은 `useBlocker` 로,
 * 새로고침·탭 닫기는 `beforeunload` 로. 문구는 브라우저가 정하며 우리 텍스트는 안 보인다.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useBlocker(() => {
    if (!isDirty) return false;
    return !window.confirm('저장하지 않은 수정 내용이 있습니다. 이 화면을 나가시겠어요?');
  });

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);
}
