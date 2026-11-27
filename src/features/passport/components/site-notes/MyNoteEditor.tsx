import { useState } from 'react';
import {
  isVisitedOnAvailable,
  type CrowdLevel,
  type MyStamp,
  type StampPhoto,
} from '@/features/passport/api/stamps.repository';
import { CrowdLevelPicker } from '@/features/passport/components/CrowdLevelPicker';
import {
  RecordPhotoTray,
  shrinkPending,
  usePendingPhotos,
} from '@/features/passport/components/RecordPhotoTray';
import {
  useDeleteStampPhoto,
  useUpdateStamp,
  useUploadStampPhotos,
} from '@/features/passport/hooks/use-stamps';
import { normalizeNote, NOTE_MAX_LENGTH } from '@/features/passport/lib/stamp-note';
import { Button } from '@/shared/components/ui/Button';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes-guard';
import { useSettings } from '@/shared/i18n/use-settings';
import { koreaTodayIso } from '@/shared/lib/korea-date';
import { nextPhotoPosition } from '@/features/passport/lib/photo-position';

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
  const updateStamp = useUpdateStamp();
  const uploadPhotos = useUploadStampPhotos(siteId);
  const deletePhoto = useDeleteStampPhoto(siteId);

  const savedVisitedOn = (myStamp.visitedOn ?? myStamp.visitedAt ?? '').slice(0, 10);
  const [myNoteDraft, setMyNoteDraft] = useState(myStamp.note ?? '');
  const [myVisitedOnDraft, setMyVisitedOnDraft] = useState(savedVisitedOn);
  const [myCrowdLevelDraft, setMyCrowdLevelDraft] = useState<CrowdLevel | null>(
    myStamp.crowdLevel ?? null,
  );
  // 사진은 고르면 바로 올라가지 않고 「저장」 때 함께 올라간다(2026-11-22, 세 기록 칸 통일)
  const tray = usePendingPhotos(myStamp.photos.length);
  const [failed, setFailed] = useState<null | 'save' | 'photo' | 'delete'>(null);
  const [saving, setSaving] = useState(false);
  const isMyNoteDirty =
    tray.pending.length > 0 ||
    myNoteDraft !== (myStamp.note ?? '') ||
    myVisitedOnDraft !== savedVisitedOn ||
    myCrowdLevelDraft !== (myStamp.crowdLevel ?? null);
  useUnsavedChangesGuard(isMyNoteDirty);

  const handleUpdateMyNote = async () => {
    if (!myStamp?.id) return;
    setFailed(null);
    setSaving(true);
    try {
      const result = await updateStamp.mutateAsync({
        stampId: myStamp.id,
        note: normalizeNote(myNoteDraft),
        ...(isVisitedOnAvailable()
          ? { visitedOn: myVisitedOnDraft || null, crowdLevel: myCrowdLevelDraft }
          : {}),
      });
      if (!result.success) return setFailed('save');
      if (tray.pending.length > 0) {
        const photos = await shrinkPending(tray.pending);
        const uploaded = await uploadPhotos.mutateAsync({
          // 내 기록 id 는 myStamp.id — 「내 기록 목록」에서 찾으면 목록이 덜 왔을 때 빈 id 로 실패했다
          stampId: myStamp.id,
          // 지운 사진 자리를 다시 쓰면 남은 사진을 덮어썼다 — 가장 큰 자리 다음에
          startPosition: nextPhotoPosition(myStamp.photos),
          photos,
        });
        if (!uploaded.success) return setFailed('photo');
        tray.clear();
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };
  const removeExisting = async (photo: StampPhoto) => {
    setFailed(null);
    const result = await deletePhoto.mutateAsync(photo);
    if (!result.success) setFailed('delete');
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
      <div className="mt-3">
        <RecordPhotoTray
          existing={myStamp.photos}
          onOpenExisting={(i) =>
            onOpenPhoto(
              myStamp.photos.map((p) => p.url),
              i,
            )
          }
          onRemoveExisting={(photo) => void removeExisting(photo)}
          removingExisting={deletePhoto.isPending}
          tray={tray}
          disabled={saving}
        />
      </div>
      {failed && (
        <p className="mt-2 text-sm font-bold text-red-600" role="alert">
          {t(
            failed === 'photo'
              ? 'photoUploadFailed'
              : failed === 'delete'
                ? 'photoDeleteFailed'
                : 'recordsSaveFailed',
          )}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        {/* 이미 남긴 한 줄을 다 지우고 저장하면 기록이 공개 목록과 이 화면의 「수정」에서 함께 사라져
              다시 고칠 길이 없어졌다(2026-11-22 조사). 한 줄은 비울 수 없다 — 기록을 없애려면 「내 기록」에서 지운다 */}
        <Button
          size="sm"
          onClick={() => void handleUpdateMyNote()}
          disabled={saving || (myStamp.note != null && normalizeNote(myNoteDraft) === null)}
        >
          {t('recordsSave')}
        </Button>
        <Button variant="neutral" size="sm" onClick={onClose}>
          {t('recordsCancel')}
        </Button>
      </div>
    </>
  );
}
