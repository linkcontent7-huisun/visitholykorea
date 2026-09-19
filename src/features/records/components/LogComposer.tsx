/**
 * 여행기 작성 폼.
 *
 * 별도 라우트가 아니라 기록 탭 안에서 펼쳐지는 카드다 — 작성이 목록과 같은
 * 자리에서 일어나야 "쓰면 바로 쌓인다"가 눈에 보인다. 성지 선택은 스탬프
 * 찍은 곳을 먼저 보여준다. 다녀온 곳을 기록하는 화면이기 때문이다.
 */

import { Camera, PenLine, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useMyStamps } from '@/features/passport/hooks/use-stamps';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { photoPolicy, shrinkPhoto } from '@/shared/lib/photo';
import { useCreateLog } from '../hooks/use-logs';

/** 오늘 날짜(YYYY-MM-DD) — date input 의 기본값. */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * `persistent` — 기록 화면에 늘 펼쳐 두는 모드(2026-09-14 사장님 요청). 취소 단추가 없고
 * 저장하면 칸이 비워진다. 기본값(false)은 예전처럼 「쓰기」로 열고 닫는 카드.
 */
export function LogComposer({
  onDone,
  persistent = false,
}: {
  onDone: () => void;
  persistent?: boolean;
}) {
  const navigate = useNavigate();
  const { t } = useSettings();
  // 성지 이름도 고른 언어로 — 외국인이 한국어 이름을 쳐서 고를 수는 없다
  const { data: sitesRaw = [] } = useSites({ limit: 300 });
  const sites = useLocalizedSites(sitesRaw);
  const { data: stamps = [] } = useMyStamps();
  const createLog = useCreateLog();

  const [siteId, setSiteId] = useState('');
  const [siteQuery, setSiteQuery] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visitDate, setVisitDate] = useState(todayISO());
  // 고른 사진 — 올리기 전 미리보기용 object URL 을 같이 든다
  const [photos, setPhotos] = useState<{ file: File; preview: string }[]>([]);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  // 미리보기 URL 은 브라우저 메모리를 잡으므로 바뀔 때마다 놓아준다
  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)), [photos]);

  const pickPhotos = (files: FileList | null) => {
    if (!files) return;
    const { maxCount } = photoPolicy();
    const room = Math.max(0, maxCount - photos.length);
    const picked = Array.from(files).slice(0, room);
    if (files.length > room)
      setPhotoNotice(fillPlaceholders(t('logPhotoLimit'), { count: maxCount }));
    else setPhotoNotice(null);
    setPhotos((prev) => [
      ...prev,
      ...picked.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  };

  const removePhoto = (index: number) => setPhotos((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setSiteId('');
    setSiteQuery('');
    setTitle('');
    setContent('');
    setVisitDate(todayISO());
    setPhotos([]);
    setPhotoNotice(null);
  };

  // 스탬프 찍은 성지를 위로 — 여행기는 대부분 다녀온 직후에 쓴다
  const { stampedSites, otherSites } = useMemo(() => {
    const stampedIds = new Set(stamps.map((s) => s.siteId));
    const sorted = [...sites].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    return {
      stampedSites: sorted.filter((s) => stampedIds.has(s.id)),
      otherSites: sorted.filter((s) => !stampedIds.has(s.id)),
    };
  }, [sites, stamps]);

  const canSubmit = siteId !== '' && title.trim() !== '' && !createLog.isPending;

  const handleSubmit = async () => {
    const site = sites.find((s) => s.id === siteId);
    if (!site) return;

    // 휴대폰 원본(3~10MB)은 올리기 전에 줄인다 — 사이트 사진과 같은 규칙
    const policy = photoPolicy();
    const shrunk = await Promise.all(photos.map((p) => shrinkPhoto(p.file, policy)));

    createLog.mutate(
      {
        siteId,
        title: title.trim(),
        content: content.trim(),
        visitDate,
        siteName: site.name,
        siteImage: site.imageUrl ?? null,
        photos: shrunk,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            if ('photoError' in result && result.photoError) window.alert(result.photoError);
            if (persistent) resetForm();
            onDone();
            return;
          }
          if (result.error === 'UNAUTHENTICATED') {
            navigate(paths.login);
            return;
          }
          window.alert(t('logSaveFailed'));
        },
      },
    );
  };

  return (
    <div className="rounded-lg border border-app-border bg-white p-7 shadow-xl shadow-gray-200/40">
      <div className="mb-5 flex items-center gap-2 text-brand-violet">
        <PenLine size={16} />
        <h2 className="text-sm font-extrabold uppercase tracking-widest">{t('logNewTitle')}</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="log-site" className="mb-1.5 block text-xs font-bold text-app-text-muted">
            {t('logSiteLabel')}
          </label>
          {/* 208곳까지 늘어난 긴 드롭다운 대신, 이름을 치면 걸러지는 검색형 입력으로 바꿨다
              (2026-09-07 피드백 — "기록할 성지가 많아질수록 긴 드롭다운은 찾기 어렵다"). */}
          <input
            id="log-site"
            type="text"
            list="log-site-options"
            placeholder={t('logSitePlaceholder')}
            value={siteQuery}
            onChange={(e) => {
              const value = e.target.value;
              setSiteQuery(value);
              const matched = sites.find((s) => s.name === value);
              setSiteId(matched ? matched.id : '');
            }}
            className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text focus:border-brand-violet focus:outline-none"
          />
          <datalist id="log-site-options">
            {stampedSites.map((s) => (
              <option key={s.id} value={s.name} label={t('logSiteStamped')} />
            ))}
            {otherSites.map((s) => (
              <option key={s.id} value={s.name} />
            ))}
          </datalist>
          {siteQuery !== '' && siteId === '' && (
            <p className="mt-1.5 text-xs text-app-text-muted">{t('logSitePickExact')}</p>
          )}
        </div>

        <div>
          <label htmlFor="log-date" className="mb-1.5 block text-xs font-bold text-app-text-muted">
            {t('logDateLabel')}
          </label>
          <input
            id="log-date"
            type="date"
            value={visitDate}
            max={todayISO()}
            onChange={(e) => setVisitDate(e.target.value)}
            className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text focus:border-brand-violet focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="log-title" className="mb-1.5 block text-xs font-bold text-app-text-muted">
            {t('logTitleLabel')}
          </label>
          <input
            id="log-title"
            type="text"
            maxLength={80}
            placeholder={t('logTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text focus:border-brand-violet focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="log-content"
            className="mb-1.5 block text-xs font-bold text-app-text-muted"
          >
            {t('logContentLabel')}
          </label>
          <textarea
            id="log-content"
            rows={5}
            placeholder={t('logContentPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none rounded-lg border border-app-border bg-app-bg px-4 py-3 text-sm leading-relaxed text-app-text focus:border-brand-violet focus:outline-none"
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-app-text-muted">{t('logPhotosLabel')}</p>
          <div className="grid grid-cols-4 gap-2">
            {photos.map((p, i) => (
              <div key={p.preview} className="relative">
                <img
                  src={p.preview}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label={t('logPhotoRemove')}
                  className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <label
              className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-brand-violet/40 text-brand-violet"
              id="log-photo-picker"
            >
              <Camera size={20} aria-hidden />
              <span className="text-[0.6875rem] font-bold">{t('logPhotoPick')}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  pickPhotos(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          {photoNotice && <p className="mt-1.5 text-xs text-app-text-muted">{photoNotice}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          {!persistent && (
            <button
              onClick={onDone}
              className="rounded-lg px-5 py-2.5 text-sm font-bold text-app-text-muted"
            >
              {t('cancel')}
            </button>
          )}
          <button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="rounded-lg bg-brand-violet px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            {createLog.isPending ? t('logSaving') : t('logSave')}
          </button>
        </div>
      </div>
    </div>
  );
}
