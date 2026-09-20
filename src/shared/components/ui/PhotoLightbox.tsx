import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 사진 확대 모달 — 순례 기록 사진을 눌러 원본 크기로 보고, 여러 장이면 넘겨 본다.
 *
 * 터치 스와이프(모바일)·화살표 단추(PC)·좌우 화살표 키보드를 모두 받는다.
 * `photos` 가 null 이면 아무것도 그리지 않는다 — 열림 상태는 호출부가 갖는다.
 */
export function PhotoLightbox({
  photos,
  index,
  onIndexChange,
  onClose,
}: {
  photos: string[] | null;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const { t } = useSettings();
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!photos) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      else if (e.key === 'ArrowRight' && index < photos.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [photos, index, onIndexChange, onClose]);

  if (!photos || photos.length === 0) return null;
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('photoEnlarge')}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return;
        const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        touchStartX.current = null;
        if (delta > 50 && hasPrev) onIndexChange(index - 1);
        else if (delta < -50 && hasNext) onIndexChange(index + 1);
      }}
    >
      {/* 배경을 눌러도 닫힌다 */}
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t('close')}
        onClick={onClose}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
      >
        <X size={22} aria-hidden />
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={() => onIndexChange(index - 1)}
          aria-label={t('photoPrev')}
          className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 lg:left-4"
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={() => onIndexChange(index + 1)}
          aria-label={t('photoNext')}
          className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60 lg:right-4"
        >
          <ChevronRight size={24} aria-hidden />
        </button>
      )}

      <img
        src={photos[index]}
        alt=""
        className="pointer-events-none relative max-h-[85vh] max-w-[92vw] object-contain"
      />

      {photos.length > 1 && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-sm font-bold tabular-nums text-white">
          {index + 1} / {photos.length}
        </p>
      )}
    </div>
  );
}
