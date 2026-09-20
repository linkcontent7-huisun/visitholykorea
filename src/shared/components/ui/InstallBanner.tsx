import { useEffect, useState } from 'react';
import { useInstallState } from '@/shared/hooks/use-install-state';
import { useSettings } from '@/shared/i18n/use-settings';
import { promptInstall } from '@/shared/lib/install-prompt';

/**
 * 「홈 화면에 추가」 조용한 배너 (QA 정의서 2026-09-19 · FR-1~FR-6).
 *
 * 강제 팝업은 쓰지 않는다 — 사용자는 방해받는 걸 싫어하고, 브라우저가 이미 자기 방식으로 알린다.
 * 대신 **설치가 실제로 가능한 환경에서만**, **두 번째 화면부터**, 상단에 한 줄로 알리고 버튼 하나를 둔다.
 * - 크롬·엣지·삼성인터넷(installable): 버튼 → 브라우저 설치 창 바로
 * - 아이폰 사파리(ios): 버튼 → 세 단계 안내가 배너 안에 펼쳐진다 (설치 창 API 가 없다)
 * - 설치됨·앱 안 브라우저·미지원: 배너 자체를 그리지 않는다
 * - 「나중에」·닫기: 7일 동안 다시 보이지 않는다 (재노출 정책, FR-6)
 */
const DISMISS_KEY = 'vhk-install-banner-dismissed-at';
const VIEWS_KEY = 'vhk-page-views';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_VIEWS = 2;

function readDismissedAt(): number {
  try {
    return Number(localStorage.getItem(DISMISS_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function bumpViews(): number {
  try {
    const n = Number(sessionStorage.getItem(VIEWS_KEY) ?? 0) + 1;
    sessionStorage.setItem(VIEWS_KEY, String(n));
    return n;
  } catch {
    return MIN_VIEWS; // 저장소를 못 쓰는 환경(사생활 보호 모드)에서는 그냥 보여준다
  }
}

export function InstallBanner({ pathname }: { pathname: string }) {
  const { t } = useSettings();
  const state = useInstallState();
  const [views, setViews] = useState(0);
  const [dismissedAt, setDismissedAt] = useState(readDismissedAt);
  const [showIosSteps, setShowIosSteps] = useState(false);

  // 화면(경로)이 바뀔 때마다 조회 수를 센다 — 첫 화면에서 바로 들이밀지 않는다
  useEffect(() => {
    setViews(bumpViews());
  }, [pathname]);

  const eligible = state === 'installable' || state === 'ios';
  const coolingDown = Date.now() - dismissedAt < COOLDOWN_MS;
  // 홈은 헤더가 `fixed` 투명으로 히어로 사진 위에 떠 있어(TopNav 참고) 배너가 헤더 뒤에 깔리고
  // 히어로를 밀어낸다 — 홈에서는 그리지 않는다. 다른 화면은 헤더가 sticky 라 그 아래 자연스럽게 붙는다.
  const isHome = pathname === '/';
  if (isHome || !eligible || coolingDown || views < MIN_VIEWS) return null;

  const dismiss = () => {
    const now = Date.now();
    try {
      localStorage.setItem(DISMISS_KEY, String(now));
    } catch {
      /* 저장 못 해도 이번 세션은 닫힌다 */
    }
    setDismissedAt(now);
  };

  const onAdd = async () => {
    const result = await promptInstall();
    if (result === 'ios') {
      setShowIosSteps(true);
      return;
    }
    // 설치했거나(accepted) 거절했거나(dismissed) — 어느 쪽이든 더 조르지 않는다
    dismiss();
  };

  return (
    <aside
      role="region"
      aria-label={t('installBannerTitle')}
      className="border-b border-brand-blue/10 bg-brand-soft px-4 py-3 text-app-text"
    >
      <div className="mx-auto flex max-w-3xl items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{t('installBannerTitle')}</p>
          <p className="text-xs text-app-text-muted">
            {showIosSteps ? t('installIosSteps') : t('installBannerBody')}
          </p>
        </div>
        {!showIosSteps && (
          <button
            type="button"
            onClick={() => void onAdd()}
            className="shrink-0 rounded-md bg-brand-blue px-3 py-1.5 text-sm font-bold text-white"
          >
            {t('installBannerCta')}
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md px-2 py-1.5 text-sm text-app-text-muted"
        >
          {t('installBannerLater')}
        </button>
      </div>
    </aside>
  );
}
