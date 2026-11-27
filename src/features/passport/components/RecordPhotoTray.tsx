import { Camera, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { StampPhoto } from '@/features/passport/api/stamps.repository';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { useSettings } from '@/shared/i18n/use-settings';
import { photoPolicy, shrinkPhoto } from '@/shared/lib/photo';

/**
 * 순례 기록의 사진 칸 — 새 기록·성지 화면 고치기·내 기록 화면 고치기가 **같은 부품**을 쓴다(2026-11-22).
 *
 * 예전에는 길마다 달랐다: 새 기록은 3장·미리 보고 함께 저장, 고치기는 5장(PC 10장)·고르는 즉시 올라감.
 * 사장님 「어떤 성지는 3장, 어떤 곳은 1개 넣으니 바로 넘어간다」 조사 뒤 결정(권장안대로):
 * 한 기록에 사진 3장, 고른 사진은 미리 보고 뺄 수 있고 「저장」을 눌러야 올라간다.
 * 이미 3장 넘게 올린 예전 기록은 지우지 않고 그대로 보이되, 더 올리지는 못한다.
 */
export const RECORD_PHOTO_MAX = 3;

export interface PendingPhoto {
  file: File;
  preview: string;
}

/** 고른 뒤 아직 올리지 않은 사진. 미리보기 주소는 뺄 때·화면을 떠날 때만 놓는다 */
export function usePendingPhotos(existingCount: number) {
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [overflow, setOverflow] = useState(false);
  const ref = useRef(pending);
  ref.current = pending;
  useEffect(() => () => ref.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  const room = Math.max(0, RECORD_PHOTO_MAX - existingCount - pending.length);

  const pick = (files: FileList | File[] | null) => {
    if (!files) return;
    const list = Array.from(files);
    const free = Math.max(0, RECORD_PHOTO_MAX - existingCount - ref.current.length);
    setOverflow(list.length > free);
    const picked = list
      .slice(0, free)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPending((prev) => [...prev, ...picked]);
  };
  const remove = (index: number) =>
    setPending((prev) => {
      const gone = prev[index];
      if (gone) URL.revokeObjectURL(gone.preview);
      return prev.filter((_, i) => i !== index);
    });
  const clear = () =>
    setPending((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });

  return { pending, room, overflow, pick, remove, clear };
}

/** 올리기 직전에 줄인다 */
export function shrinkPending(pending: readonly PendingPhoto[]): Promise<Blob[]> {
  const policy = photoPolicy();
  return Promise.all(pending.map((p) => shrinkPhoto(p.file, policy)));
}

interface RecordPhotoTrayProps {
  /** 이미 올린 사진(고치기). 새 기록이면 빈 배열 */
  existing?: readonly StampPhoto[];
  onOpenExisting?: (index: number) => void;
  onRemoveExisting?: (photo: StampPhoto) => void;
  removingExisting?: boolean;
  tray: ReturnType<typeof usePendingPhotos>;
  disabled?: boolean;
}

export function RecordPhotoTray({
  existing = [],
  onOpenExisting,
  onRemoveExisting,
  removingExisting = false,
  tray,
  disabled = false,
}: RecordPhotoTrayProps) {
  const { t } = useSettings();
  const count = existing.length + tray.pending.length;
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {existing.map((photo, i) => (
          <div key={photo.id} className="relative">
            <SquircleSurface
              as="button"
              type="button"
              onClick={() => onOpenExisting?.(i)}
              aria-label={t('photoEnlarge')}
              className="h-16 w-16 overflow-hidden"
            >
              <img src={photo.url} alt={t('photoMineAlt')} className="h-full w-full object-cover" />
            </SquircleSurface>
            {onRemoveExisting && (
              <button
                type="button"
                onClick={() => onRemoveExisting(photo)}
                disabled={removingExisting || disabled}
                aria-label={t('photoDelete')}
                className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-50"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {tray.pending.map((p, i) => (
          <div key={p.preview} className="relative">
            <SquircleSurface className="h-16 w-16 overflow-hidden">
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
            </SquircleSurface>
            <button
              type="button"
              onClick={() => tray.remove(i)}
              disabled={disabled}
              aria-label={t('logPhotoRemove')}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-50"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {tray.room > 0 && (
          <SquircleSurface
            as="label"
            borderColor="color-mix(in srgb, var(--color-brand-blue) 40%, transparent)"
            borderWidth={2}
            borderDashed
            className={`flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-0.5 text-brand-blue transition-colors hover:bg-brand-soft ${disabled ? 'pointer-events-none opacity-50' : ''}`}
          >
            <Camera size={16} aria-hidden />
            <span className="text-xs font-bold">
              {count}/{RECORD_PHOTO_MAX}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={disabled}
              className="hidden"
              aria-label={t('photoAdd')}
              onChange={(e) => {
                tray.pick(e.target.files);
                e.target.value = '';
              }}
            />
          </SquircleSurface>
        )}
      </div>
      {tray.overflow && (
        <p className="mt-1.5 text-xs text-app-text-muted">
          {t('reviewPhotosMax').replace('{count}', String(RECORD_PHOTO_MAX))}
        </p>
      )}
    </div>
  );
}
