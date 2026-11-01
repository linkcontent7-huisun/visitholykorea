import { AnimatePresence, motion } from 'motion/react';
import { Camera, MapPin, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useDirectorySearch } from '@/features/sites/hooks/use-nearby-directory';
import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { useModalFocus } from '@/shared/hooks/use-modal-focus';
import { useSettings } from '@/shared/i18n/use-settings';
import { koreaTodayIso } from '@/shared/lib/korea-date';
import { photoPolicy, shrinkPhoto } from '@/shared/lib/photo';
import { useCreatePlace } from '../hooks/use-places';
import { EMOTIONS, type EmotionId } from '../lib/emotions';

interface NewPlaceSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 「새 장소 기록하기」 — 성지 213곳 밖의 성당·공소·가톨릭 건물 (2026-11-01 사장님 지시).
 *
 * 꼭 받는 것은 셋: **장소 이름 · 사진 · 그날의 감정.** 나머지는 귀찮으면 비워도 된다.
 * 이름을 치면 주교회의 주소록(5,918곳)에서 같은 곳을 찾아 주고, 고르면 주소가 저절로 찬다 —
 * 같은 성당이 이름만 조금씩 다르게 여러 번 쌓이는 것을 줄인다.
 * 저장하면 「관리자 확인 중」으로 들어가고, 확인된 뒤에만 다른 사람에게 보인다.
 */
export function NewPlaceSheet({ isOpen, onClose }: NewPlaceSheetProps) {
  const { t } = useSettings();
  const dialogRef = useModalFocus<HTMLDivElement>(isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-place-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex max-h-[94dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
          >
            <header className="flex shrink-0 items-center justify-between border-b border-app-border px-5 py-3">
              <h2 id="new-place-title" className="text-lg font-extrabold text-app-text">
                {t('placeNewTitle')}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-app-text-muted hover:bg-app-bg"
                aria-label={t('close')}
              >
                <X size={22} />
              </button>
            </header>
            <PlaceForm onDone={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function PlaceForm({ onDone }: { onDone: () => void }) {
  const { t } = useSettings();
  const create = useCreatePlace();

  const [name, setName] = useState('');
  const [directoryId, setDirectoryId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<EmotionId | null>(null);
  const [emotionNote, setEmotionNote] = useState('');
  const [description, setDescription] = useState('');
  const [visitedOn, setVisitedOn] = useState(koreaTodayIso());
  const [showMissing, setShowMissing] = useState(false);
  const [failed, setFailed] = useState(false);

  // 주소록에서 고른 뒤에는 추천을 닫는다 — 이름을 다시 고치면 연결을 끊고 다시 찾는다
  const debouncedName = useDebouncedValue(directoryId ? '' : name, 300);
  const { data: suggestions = [] } = useDirectorySearch(
    debouncedName.trim().length >= 2 ? debouncedName : '',
  );

  useEffect(() => {
    if (!photo) return;
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const missing = {
    name: !name.trim(),
    photo: !photo,
    emotion: !emotion,
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhoto(await shrinkPhoto(file, photoPolicy()));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing.name || missing.photo || missing.emotion || !photo || !emotion) {
      setShowMissing(true);
      return;
    }
    setFailed(false);
    const result = await create.mutateAsync({
      directoryId,
      name,
      address,
      description,
      photo,
      emotion,
      emotionNote,
      visitedOn,
    });
    if (result.success) onDone();
    else setFailed(true);
  };

  const label = 'mb-1.5 block text-base font-bold text-app-text';
  const optional = 'ml-1 text-sm font-normal text-app-text-muted';
  const required = 'ml-1 text-sm font-bold text-red-700';
  const input =
    'min-h-12 w-full rounded-lg border border-app-input-border bg-white px-3 text-base text-app-text focus:border-brand-blue';
  const missingNote = 'mt-1 text-sm font-bold text-red-700';

  return (
    <form onSubmit={submit} className="flex-1 space-y-6 overflow-y-auto px-5 py-5" noValidate>
      <p className="text-sm leading-relaxed text-app-text-muted">{t('placeNewGuide')}</p>

      {/* 1. 장소 이름 (필수) — 주소록 추천 */}
      <div>
        <label htmlFor="place-name" className={label}>
          {t('placeName')}
          <span className={required}>{t('placeRequired')}</span>
        </label>
        <input
          id="place-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirectoryId(null);
          }}
          placeholder={t('placeNamePlaceholder')}
          className={input}
          autoComplete="off"
          aria-invalid={(showMissing && missing.name) || undefined}
        />
        {showMissing && missing.name && <p className={missingNote}>{t('placeNameMissing')}</p>}
        {suggestions.length > 0 && (
          <ul className="mt-2 divide-y divide-app-border overflow-hidden rounded-lg border border-app-border">
            {suggestions.slice(0, 5).map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    setName(entry.name);
                    setAddress(entry.address ?? '');
                    setDirectoryId(entry.id);
                  }}
                  className="flex min-h-12 w-full items-start gap-2 px-3 py-2 text-left hover:bg-app-bg"
                >
                  <MapPin size={18} className="mt-0.5 shrink-0 text-brand-blue" aria-hidden />
                  <span>
                    <span className="block font-bold text-app-text">{entry.name}</span>
                    <span className="block text-sm text-app-text-muted">{entry.address}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {directoryId && <p className="mt-1 text-sm text-brand-blue">✓ {t('placeLinked')}</p>}
      </div>

      {/* 2. 사진 (필수) */}
      <div>
        <span className={label}>
          {t('placePhoto')}
          <span className={required}>{t('placeRequired')}</span>
        </span>
        <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed border-app-input-border bg-app-bg text-app-text-muted">
          {preview ? (
            <img src={preview} alt="" className="max-h-60 w-full object-cover" />
          ) : (
            <>
              <Camera size={28} aria-hidden />
              <span className="text-base font-bold">{t('placePhotoPick')}</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => void pickPhoto(e.target.files?.[0])}
          />
        </label>
        {showMissing && missing.photo && <p className={missingNote}>{t('placePhotoMissing')}</p>}
      </div>

      {/* 3. 그날의 감정 (필수) + 한 줄 (선택) */}
      <fieldset>
        <legend className={label}>
          {t('placeEmotion')}
          <span className={required}>{t('placeRequired')}</span>
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {EMOTIONS.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setEmotion(e.id)}
              aria-pressed={emotion === e.id}
              className={`flex min-h-16 flex-col items-center justify-center rounded-xl border-[1.5px] text-sm font-bold ${
                emotion === e.id
                  ? 'border-brand-blue bg-brand-blue text-white'
                  : 'border-app-border bg-white text-app-text'
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {e.emoji}
              </span>
              {t(e.labelKey)}
            </button>
          ))}
        </div>
        {showMissing && missing.emotion && (
          <p className={missingNote}>{t('placeEmotionMissing')}</p>
        )}
        <input
          value={emotionNote}
          onChange={(e) => setEmotionNote(e.target.value)}
          maxLength={200}
          placeholder={t('placeEmotionNotePlaceholder')}
          aria-label={t('placeEmotionNotePlaceholder')}
          className={`${input} mt-2`}
        />
      </fieldset>

      {/* 4. 선택 칸 — 귀찮으면 넘어가도 된다 */}
      <div>
        <label htmlFor="place-address" className={label}>
          {t('placeAddress')}
          <span className={optional}>{t('placeOptional')}</span>
        </label>
        <input
          id="place-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={200}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="place-description" className={label}>
          {t('placeDescription')}
          <span className={optional}>{t('placeOptional')}</span>
        </label>
        <textarea
          id="place-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          className={`${input} py-2`}
        />
      </div>
      <div>
        <label htmlFor="place-date" className={label}>
          {t('placeVisitedOn')}
        </label>
        <input
          id="place-date"
          type="date"
          value={visitedOn}
          max={koreaTodayIso()}
          onChange={(e) => setVisitedOn(e.target.value || koreaTodayIso())}
          className={input}
        />
      </div>

      {failed && (
        <p className="font-bold text-red-700" role="alert">
          {t('placeSaveFailed')}
        </p>
      )}
      <button
        type="submit"
        disabled={create.isPending}
        className="min-h-14 w-full rounded-xl bg-brand-blue text-lg font-bold text-white disabled:opacity-60"
      >
        {create.isPending ? t('processing') : t('placeSave')}
      </button>
      <p className="pb-2 text-center text-sm text-app-text-muted">{t('placeReviewNote')}</p>
    </form>
  );
}
