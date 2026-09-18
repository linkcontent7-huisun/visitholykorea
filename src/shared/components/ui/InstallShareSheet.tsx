import { Share2, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/shared/i18n/use-settings';
import { promptInstall, type InstallResult } from '@/shared/lib/install-prompt';
import { shareApp, type ShareResult } from '@/shared/lib/share-app';

/**
 * 「홈화면 추가」 시트 — 홈 화면에 추가 + 링크 공유, 두 가지만.
 *
 * 예전엔 설정 화면 「지원 및 정보」 안에 묻혀 있던 항목이다. 사장님 요청(2026-09-13)으로
 * 하단 탭 넷째 자리로 꺼냈고, 「전체」 화면의 서비스 목록에서도 같은 시트를 연다.
 * 하단 탭 위에 붙는 시트라 `bottom-[70px]` 은 BottomNav 높이와 같아야 한다.
 */
export function InstallShareSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useSettings();
  const [installResult, setInstallResult] = useState<InstallResult | null>(null);
  const [shareResult, setShareResult] = useState<ShareResult | null>(null);

  if (!open) return null;

  // 설치 창을 못 띄우는 환경(아이폰·카카오톡 안)은 방법을 부제로 안내한다
  const installHint = (() => {
    switch (installResult) {
      case 'installed':
        return t('installAlready');
      case 'accepted':
        return t('installDone');
      case 'ios':
        return t('installIosHint');
      case 'in-app':
        return t('installInAppHint');
      case 'manual':
        return t('installManualHint');
      default:
        return t('installSub');
    }
  })();
  const shareHint =
    shareResult === 'copied'
      ? t('copied')
      : shareResult === 'error'
        ? t('copyFailed')
        : t('shareApp');

  const actions = [
    {
      id: 'install',
      icon: Smartphone,
      label: t('installApp'),
      hint: installHint,
      onClick: () => void promptInstall().then(setInstallResult),
    },
    {
      id: 'share',
      icon: Share2,
      label: t('shareLink'),
      hint: shareHint,
      onClick: () => void shareApp().then(setShareResult),
    },
  ];

  return (
    <>
      {/* 뒤를 눌러도 닫히게 — 시트 밖을 누르는 습관을 존중한다 */}
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        aria-label={t('close')}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={t('installTab')}
        className="fixed bottom-[70px] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 rounded-t-lg border-t border-app-border bg-white px-5 pb-5 pt-4 lg:bottom-0 lg:rounded-lg lg:border"
        id="install-share-sheet"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-bold text-app-text">{t('installTab')}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-bg"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={a.onClick}
              className="flex w-full items-center gap-4 rounded-lg border border-app-border bg-app-bg px-4 py-3.5 text-left transition-colors hover:border-brand-blue"
              id={`install-share-${a.id}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-brand-blue">
                <a.icon size={22} aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-bold text-app-text">{a.label}</span>
                <span className="mt-0.5 block text-sm leading-snug text-app-text-muted">
                  {a.hint}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
