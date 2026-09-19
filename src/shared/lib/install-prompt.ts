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

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
  });
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
