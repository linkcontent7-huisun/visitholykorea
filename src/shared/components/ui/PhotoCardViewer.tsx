import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 카드 안 사진 보기 — 순례 기록 카드에서 사진을 누르면 전체 화면 모달 대신
 * **그 카드 영역 자체**를 사진으로 채운다(2026-09-21 사장님 지시).
 *
 * 부모(카드)가 `relative overflow-hidden` 이어야 한다 — `absolute inset-0` 으로 카드를 덮고
 * 카드의 스쿼클 clip-path 를 그대로 물려받는다. 카드 높이는 그대로라 목록이 출렁이지 않는다.
 * 여러 장이면 터치 스와이프·화살표 단추·좌우 화살표 키로 넘기고, Esc 로 닫는다.
 * 모달이 아니므로 화면 나머지를 inert 로 막지 않는다 — 열리면 닫기 단추로 포커스만 옮기고,
 * 닫히면 열었던 사진 단추로 돌려준다.
 * `photos` 가 null 이면 아무것도 그리지 않는다 — 열림 상태는 호출부가 갖는다.
 */
export function PhotoCardViewer({
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const open = !!photos && photos.length > 0;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // 열리면 닫기 단추로 포커스, 닫히면 열었던 자리로
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!photos) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
      else if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      else if (e.key === 'ArrowRight' && index < photos.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [photos, index, onIndexChange]);

  if (!photos || photos.length === 0) return null;
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  return (
    <div
      role="group"
      aria-label={t('photoEnlarge')}
      className="absolute inset-0 z-10 bg-black"
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
      {/* 사진이 카드를 가득 채운다 — 빈 alt 면 스크린리더에 「이미지」로만 들린다 */}
      <img
        src={photos[index]}
        alt={`${t('photoEnlarge')} ${index + 1} / ${photos.length}`}
        className="h-full w-full object-cover"
      />
      {/* 사진을 눌러도 닫힌다 */}
      <button
        type="button"
        className="absolute inset-0"
        aria-label={t('close')}
        onClick={onClose}
      />
      {/* 어두운 사진 위라 전역 남색 포커스 선이 안 보인다 — 흰 선으로 */}
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-white"
      >
        <X size={22} aria-hidden />
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={() => onIndexChange(index - 1)}
          aria-label={t('photoPrev')}
          className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-white"
        >
          <ChevronLeft size={24} aria-hidden />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          onClick={() => onIndexChange(index + 1)}
          aria-label={t('photoNext')}
          className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus-visible:outline-white"
        >
          <ChevronRight size={24} aria-hidden />
        </button>
      )}

      {photos.length > 1 && (
        <p
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-bold tabular-nums text-white"
          aria-live="polite"
        >
          {index + 1} / {photos.length}
        </p>
      )}
    </div>
  );
}
