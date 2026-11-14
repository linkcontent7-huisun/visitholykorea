import { Camera, X } from 'lucide-react';
import { useState } from 'react';
import {
  isVisitedOnAvailable,
  type CrowdLevel,
  type MyStamp,
} from '@/features/passport/api/stamps.repository';
import { CrowdLevelPicker } from '@/features/passport/components/CrowdLevelPicker';
import {
  useDeleteStampPhoto,
  useMyStamps,
  useUpdateStamp,
  useUploadStampPhotos,
} from '@/features/passport/hooks/use-stamps';
import { normalizeNote, NOTE_MAX_LENGTH } from '@/features/passport/lib/stamp-note';
import { Button } from '@/shared/components/ui/Button';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes-guard';
import { useSettings } from '@/shared/i18n/use-settings';
import { koreaTodayIso } from '@/shared/lib/korea-date';
import { photoPolicy, shrinkPhoto } from '@/shared/lib/photo';

interface MyNoteEditorProps {
  siteId: string;
  myStamp: MyStamp;
  onClose: () => void;
  onOpenPhoto: (photos: string[], index: number) => void;
}

/**
 * 「기록 모두 보기」 목록 안에서 내 기록을 바로 고치는 칸 — 한 줄·방문일·붐빔·사진.
 * 열릴 때 지금 기록으로 초안을 채운다. (#102 에서 SiteDetailPage 에서 떼어 냄)
 */
export function MyNoteEditor({ siteId, myStamp, onClose, onOpenPhoto }: MyNoteEditorProps) {
  const { t } = useSettings();
  const { data: myStamps = [] } = useMyStamps();
  const updateStamp = useUpdateStamp();
  const uploadPhotos = useUploadStampPhotos(siteId);
  const deletePhoto = useDeleteStampPhoto(siteId);

  const savedVisitedOn = (myStamp.visitedOn ?? myStamp.visitedAt ?? '').slice(0, 10);
  const [myNoteDraft, setMyNoteDraft] = useState(myStamp.note ?? '');
  const [myVisitedOnDraft, setMyVisitedOnDraft] = useState(savedVisitedOn);
  const [myCrowdLevelDraft, setMyCrowdLevelDraft] = useState<CrowdLevel | null>(
    myStamp.crowdLevel ?? null,
  );
  const isMyNoteDirty =
    myNoteDraft !== (myStamp.note ?? '') ||
    myVisitedOnDraft !== savedVisitedOn ||
    myCrowdLevelDraft !== (myStamp.crowdLevel ?? null);
  useUnsavedChangesGuard(isMyNoteDirty);

  const handleUpdateMyNote = () => {
    if (!myStamp?.id) return;
    updateStamp.mutate(
      {
        stampId: myStamp.id,
        note: normalizeNote(myNoteDraft),
        ...(isVisitedOnAvailable()
          ? { visitedOn: myVisitedOnDraft || null, crowdLevel: myCrowdLevelDraft }
          : {}),
      },
      { onSuccess: (result) => result.success && onClose() },
    );
  };
  const handlePhotoPick = async (files: FileList | null) => {
    if (!files || !myStamp) return;
    const policy = photoPolicy();
    // 이미 있는 사진 뒤에 이어 붙인다 — 위치(position)가 겹치면 기존 사진을 덮어쓰므로
    // 새로 고른 만큼만 남은 자리에서 자른다(2026-09-20, 「바꾸기」 아닌 「추가」로 고침).
    const room = Math.max(0, policy.maxCount - myStamp.photos.length);
    const picked = Array.from(files).slice(0, room);
    if (files.length > room)
      window.alert(t('reviewPhotosMax').replace('{count}', String(policy.maxCount)));
    const photos = await Promise.all(picked.map((file) => shrinkPhoto(file, policy)));
    uploadPhotos.mutate({
      stampId: myStamp.stamped ? (myStamps.find((s) => s.siteId === siteId)?.stampId ?? '') : '',
      startPosition: myStamp.photos.length + 1,
      photos,
    });
  };

  return (
    <>
      <label className="block text-sm font-bold text-app-text-muted">
        {t('recordsMemo')}
        <SquircleSurface
          borderColor="var(--color-app-input-border)"
          borderClassName="transition-colors group-focus-within:stroke-brand-blue group-focus-within:stroke-[6px]"
          className="group mt-1 overflow-hidden bg-white"
        >
          <input
            type="text"
            maxLength={NOTE_MAX_LENGTH}
            value={myNoteDraft}
            onChange={(e) => setMyNoteDraft(e.target.value)}
            className="block min-h-12 w-full bg-transparent px-3 text-base text-app-text focus-visible:outline-none"
          />
        </SquircleSurface>
      </label>
      {isVisitedOnAvailable() && (
        <label className="mt-3 block text-sm font-bold text-app-text-muted">
          {t('recordsVisitedOn')}
          <SquircleSurface
            borderColor="var(--color-app-input-border)"
            borderClassName="transition-colors group-focus-within:stroke-brand-blue group-focus-within:stroke-[6px]"
            className="group mt-1 overflow-hidden bg-white"
          >
            <input
              type="date"
              value={myVisitedOnDraft}
              max={koreaTodayIso()}
              onChange={(e) => setMyVisitedOnDraft(e.target.value)}
              className="block min-h-12 w-full bg-transparent px-3 text-base text-app-text"
            />
          </SquircleSurface>
        </label>
      )}
      {isVisitedOnAvailable() && (
        <CrowdLevelPicker
          value={myCrowdLevelDraft}
          onChange={setMyCrowdLevelDraft}
          name="myCrowdLevel"
        />
      )}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {myStamp.photos.map((photo, i) => (
          <div key={photo.id} className="relative shrink-0">
            <SquircleSurface
              as="button"
              type="button"
              onClick={() =>
                onOpenPhoto(
                  myStamp.photos.map((p) => p.url),
                  i,
                )
              }
              aria-label={t('photoEnlarge')}
              className="block h-24 w-24 overflow-hidden"
            >
              <img src={photo.url} alt={t('photoMineAlt')} className="h-full w-full object-cover" />
            </SquircleSurface>
            <button
              type="button"
              onClick={() => deletePhoto.mutate(photo)}
              disabled={deletePhoto.isPending}
              aria-label={t('photoDelete')}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white disabled:opacity-50"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {myStamp.photos.length < photoPolicy().maxCount && (
          <SquircleSurface
            as="label"
            borderColor="color-mix(in srgb, var(--color-brand-blue) 50%, transparent)"
            borderWidth={2}
            borderDashed
            className={`flex h-24 w-16 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 px-1 text-center text-brand-blue transition-colors hover:bg-brand-soft ${
              uploadPhotos.isPending ? 'opacity-50' : ''
            }`}
          >
            <Camera size={16} aria-hidden />
            <span className="text-[0.625rem] font-bold leading-tight">
              {uploadPhotos.isPending ? t('photoUploading') : t('photoAdd')}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploadPhotos.isPending}
              onChange={(e) => {
                void handlePhotoPick(e.target.files);
                e.target.value = '';
              }}
              data-testid="photo-input"
            />
          </SquircleSurface>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={handleUpdateMyNote} disabled={updateStamp.isPending}>
          {t('recordsSave')}
        </Button>
        <Button variant="neutral" size="sm" onClick={onClose}>
          {t('recordsCancel')}
        </Button>
      </div>
    </>
  );
}
