/**
 * 「홈 화면에 추가」(PWA 설치).
 *
 * 크롬·삼성인터넷은 `beforeinstallprompt` 를 던져 주는데, 이 이벤트는 앱이 뜨는 순간 한 번만
 * 오고 붙잡아 두지 않으면 사라진다. 그래서 모듈이 로드될 때 바로 잡아 둔다.
 * 아이폰 사파리와 카카오톡 안 브라우저는 이 이벤트가 없다 — 그 경우 화면이 설치 방법을 안내한다.
 */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // 브라우저 자체 미니 배너를 막고(preventDefault) 우리 화면에서 원할 때 띄운다 — QA 정의서 FR-2 결정
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/**
 * 설치 상태 (QA 정의서 FR-1). 화면은 이 값 하나로 분기한다.
 * - installed: 이미 홈 화면 앱으로 실행 중 → 설치 유도 UI 를 숨긴다 (FR-4)
 * - installable: 크롬·엣지·삼성인터넷이 설치 창을 줄 수 있음 → 버튼 한 번에 설치
 * - ios: 아이폰 사파리 — 설치 창 API 가 없어 수동 안내 (FR-3)
 * - in-app: 카카오톡·인스타 안 브라우저 — 홈 화면 추가 불가, 다른 브라우저로 열라고 안내
 * - unsupported: 그 밖(데스크톱 파이어폭스·사파리 등) — 조용히 숨긴다 (FR-5)
 */
export type InstallState = 'installed' | 'installable' | 'ios' | 'in-app' | 'unsupported';

export function getInstallState(): InstallState {
  if (isStandalone()) return 'installed';
  if (isInAppBrowser()) return 'in-app';
  if (deferred) return 'installable';
  if (isIos()) return 'ios';
  return 'unsupported';
}

/** 설치 상태가 바뀔 때(설치 창이 준비되거나, 설치가 끝나거나) 알려준다. 해제 함수를 돌려준다. */
export function subscribeInstallState(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export type InstallResult = 'accepted' | 'dismissed' | 'installed' | 'ios' | 'in-app' | 'manual';

/** 이미 홈 화면에서 실행 중인지 (설치된 앱 창). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** 카카오톡·인스타그램 같은 앱 안 브라우저 — 홈 화면 추가가 안 된다. */
export function isInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
}

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) return true;
  // 사파리에서 "데스크톱 웹사이트로 보기"를 켜면 아이폰도 User-Agent 가 macOS 로 바뀌어
  // 위 검사를 그냥 통과해 버린다 — 애플 터치스크린 기기만 maxTouchPoints > 1 인 걸로 구분한다
  // (2026-09-19: 실기기에서 이 때문에 아이폰인데도 설치 안내가 데스크톱용으로 잘못 떴다).
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/** 설치를 시도한다. 브라우저 창을 띄울 수 없으면 왜 안 되는지를 돌려준다. */
export async function promptInstall(): Promise<InstallResult> {
  if (isStandalone()) return 'installed';
  if (isInAppBrowser()) return 'in-app';
  if (deferred) {
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') deferred = null;
    return outcome;
  }
  return isIos() ? 'ios' : 'manual';
}
