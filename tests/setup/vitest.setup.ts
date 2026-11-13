import '@testing-library/jest-dom/vitest';
import { configure } from '@testing-library/react';

/**
 * waitFor 기본 제한은 1초다. `npm run verify` 는 타입검사·린트·테스트를 잇달아
 * 돌리는데, CPU 가 붐비면 렌더가 1초를 넘겨 **코드는 멀쩡한데 테스트만** 깨진다.
 * 2026-09-04 에 실제로 그렇게 한 번 터졌고(재실행 4회는 전부 통과), 간헐적
 * 실패는 9/21 마감 앞에서 가장 비싼 종류의 노이즈다. 여유를 준다 —
 * 진짜 무한대기는 5초에도 어차피 걸린다.
 */
configure({ asyncUtilTimeout: 5000 });

// 테스트에서는 실제 Supabase 를 부르지 않으므로 자리표시 값을 넣어 둔다.
// TourAPI 키는 브라우저 쪽에 없다(중계 /api/tour 가 서버에서 붙인다).
// (shared/config/env.ts 가 필수 환경변수 누락 시 예외를 던지기 때문에 필요하다.)
Object.assign(import.meta.env, {
  VITE_SUPABASE_URL: 'https://test.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
});

// jsdom 에는 ResizeObserver 가 없다 — 스쿼클 모서리(use-squircle) 처럼 실제 렌더
// 크기를 재는 컴포넌트가 마운트만 해도 죽는다. 크기 관찰 자체는 테스트 대상이
// 아니므로 아무 것도 안 하는 자리표시로 채운다.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// Node 25+ 는 자체 localStorage 를 전역에 두는데, --localstorage-file 없이 돌면
// 값이 비어(undefined) jsdom 의 저장소를 가린다. 2026-11-13 맥(Node 26)에서
// 퀴즈 팝업 테스트 2개가 이 때문에 깨졌다. 쓸 수 없을 때만 메모리 저장소로 채운다.
function usableStorage(s: Storage | undefined): boolean {
  try {
    s?.setItem('__probe', '1');
    s?.removeItem('__probe');
    return !!s;
  } catch {
    return false;
  }
}
if (!usableStorage(globalThis.localStorage)) {
  const data = new Map<string, string>();
  const memory: Storage = {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, String(v)),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: memory, configurable: true });
}
