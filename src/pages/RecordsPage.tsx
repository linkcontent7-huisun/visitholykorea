/**
 * 내 기록 — 최소 기능(재기획 2026-09-14 §6).
 *
 *   장소(성지 검색으로 고른다) · 방문일 · 짧은 메모 · 비공개 기본 · 수정 · 삭제
 *
 * 인증서 PDF·공유 카드·스탬프 장식·교구 진행률·공개 사진 선정은 이번 제출 범위에서 뺐다.
 * 코드(`features/passport/lib/*`)는 남아 있어 나중에 다시 붙일 수 있다.
 *
 * 기록의 정체는 `pilgrimage_stamps` 행 하나다. 장소를 고르는 입구는 성지 상세의
 * 「순례 기록 남기기」 버튼이고, 여기서는 목록·수정·삭제만 한다. 방문일(`visited_on`)은
 * 마이그레이션 20260914130000 이 운영 DB 에 적용된 뒤에만 편집할 수 있다 — 그 전에는
 * 열이 없다는 사실을 화면에 그대로 적는다.
 */

import { Calendar, Camera, Heart, MapPin, PenLine, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { useMyFavoriteIds } from '@/features/favorites/hooks/use-favorites';
import { isVisitedOnAvailable, type StampedSite } from '@/features/passport/api/stamps.repository';
import {
  useDeleteStamp,
  useDeleteStampPhoto,
  useMyStamps,
  useUpdateStamp,
  useUploadStampPhotos,
} from '@/features/passport/hooks/use-stamps';
import { SiteListItem } from '@/features/sites/components/SiteListItem';
import { useLocalizedSites, useSites } from '@/features/sites/hooks/use-sites';
import { Button, ButtonLink } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { PhotoLightbox } from '@/shared/components/ui/PhotoLightbox';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { dioceseLabel } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { useUnsavedChangesGuard } from '@/shared/hooks/use-unsaved-changes-guard';
import { SUBMISSION_MODE } from '@/shared/lib/feature-flags';
import { photoPolicy, shrinkPhoto } from '@/shared/lib/photo';

function formatDate(value: string, locale: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

/** 방문일이 없으면(고른 적 없음) 기록한 날을 기본값으로 — 빈 채로 두면 "고르지 않음"처럼 보인다. */
function defaultVisitedOn(stamp: StampedSite): string {
  return stamp.visitedOn ?? stamp.visitedAt.slice(0, 10);
}

function RecordItem({ stamp }: { stamp: StampedSite }) {
  const { t, language } = useSettings();
  const locale = SPEECH_LOCALE[language];
  const update = useUpdateStamp();
  const remove = useDeleteStamp();
  const uploadPhotos = useUploadStampPhotos(stamp.siteId);
  const deletePhoto = useDeleteStampPhoto(stamp.siteId);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(stamp.note ?? '');
  const [visitedOn, setVisitedOn] = useState(defaultVisitedOn(stamp));
  const [failed, setFailed] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const canEditDate = isVisitedOnAvailable();

  const isDirty = editing && (note !== (stamp.note ?? '') || visitedOn !== defaultVisitedOn(stamp));
  useUnsavedChangesGuard(isDirty);

  const save = async () => {
    setFailed(false);
    const result = await update.mutateAsync({
      stampId: stamp.stampId,
      note: note.trim() || null,
      ...(canEditDate ? { visitedOn: visitedOn || null } : {}),
    });
    if (!result.success) {
      setFailed(true);
      return;
    }
    setEditing(false);
  };

  const confirmDelete = async () => {
    if (!window.confirm(t('recordsDeleteConfirm'))) return;
    const result = await remove.mutateAsync(stamp.stampId);
    if (!result.success) setFailed(true);
  };

  const handlePhotoPick = async (files: FileList | null) => {
    if (!files) return;
    const policy = photoPolicy();
    const room = Math.max(0, policy.maxCount - stamp.photos.length);
    const picked = Array.from(files).slice(0, room);
    if (files.length > room)
      window.alert(t('reviewPhotosMax').replace('{count}', String(policy.maxCount)));
    const photos = await Promise.all(picked.map((file) => shrinkPhoto(file, policy)));
    uploadPhotos.mutate({ stampId: stamp.stampId, startPosition: stamp.photos.length + 1, photos });
  };

  return (
    <SquircleSurface
      as="li"
      borderColor="var(--color-app-border)"
      className="overflow-hidden bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={paths.siteDetail(stamp.siteId)}
            className="block truncate text-lg font-bold text-app-text hover:text-brand-blue"
          >
            {stamp.siteName}
          </Link>
          {stamp.diocese && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-app-text-muted">
              <MapPin size={14} aria-hidden />
              {dioceseLabel(stamp.diocese, language)}
            </p>
          )}
          <p className="mt-2 flex items-center gap-1.5 text-sm text-app-text-muted">
            <Calendar size={14} aria-hidden />
            {stamp.visitedOn
              ? `${t('recordsVisitedOn')} · ${formatDate(stamp.visitedOn, locale)}`
              : `${t('recordsRecordedOn')} · ${formatDate(stamp.visitedAt, locale)}`}
          </p>
        </div>
        {!editing && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-bg hover:text-app-text"
              aria-label={t('recordsEdit')}
            >
              <PenLine size={20} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={remove.isPending}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-bg hover:text-red-600"
              aria-label={t('recordsDelete')}
            >
              <Trash2 size={20} aria-hidden />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          {canEditDate ? (
            <label className="block text-sm font-bold text-app-text-muted">
              {t('recordsVisitedOn')}
              <SquircleSurface
                borderColor="var(--color-app-border)"
                className="mt-1 overflow-hidden bg-white"
              >
                <input
                  type="date"
                  name="visitedOn"
                  value={visitedOn}
                  onChange={(e) => setVisitedOn(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="block min-h-12 w-full bg-transparent px-3 text-base text-app-text"
                />
              </SquircleSurface>
            </label>
          ) : (
            <p className="text-sm leading-relaxed text-app-text-muted">
              {t('recordsVisitDateUnavailable')}
            </p>
          )}
          <label className="block text-sm font-bold text-app-text-muted">
            {t('recordsMemo')}
            <SquircleSurface
              borderColor="var(--color-app-border)"
              className="mt-1 overflow-hidden bg-white"
            >
              <textarea
                value={note}
                name="note"
                onChange={(e) => setNote(e.target.value.slice(0, 120))}
                rows={3}
                maxLength={120}
                className="block w-full resize-y bg-transparent px-3 py-2 text-base text-app-text"
              />
            </SquircleSurface>
          </label>
          {/* 사진 — 확대해서 보고, 각 사진에 삭제 단추가 붙는다(SiteDetailPage 와 같은 부품) */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {stamp.photos.map((photo, i) => (
              <div key={photo.id} className="relative shrink-0">
                <SquircleSurface
                  as="button"
                  type="button"
                  onClick={() => setLightbox(i)}
                  aria-label={t('photoEnlarge')}
                  className="block h-24 w-24 overflow-hidden"
                >
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
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
            {stamp.photos.length < photoPolicy().maxCount && (
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
                <span className="text-xs font-bold leading-tight">
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
                />
              </SquircleSurface>
            )}
          </div>
          {failed && (
            <p className="text-sm font-bold text-red-600" role="alert">
              {t('recordsSaveFailed')}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={update.isPending}>
              {t('recordsSave')}
            </Button>
            <Button
              variant="neutral"
              size="sm"
              onClick={() => {
                setEditing(false);
                setNote(stamp.note ?? '');
                setVisitedOn(defaultVisitedOn(stamp));
              }}
            >
              {t('recordsCancel')}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {stamp.note && (
            <SquircleSurface
              as="p"
              className="mt-3 bg-app-bg px-4 py-3 text-base leading-relaxed text-app-text"
            >
              {stamp.note}
            </SquircleSurface>
          )}
          {stamp.photos.length > 0 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {stamp.photos.map((photo, i) => (
                <SquircleSurface
                  as="button"
                  key={photo.id}
                  type="button"
                  onClick={() => setLightbox(i)}
                  aria-label={t('photoEnlarge')}
                  className="block h-24 w-24 shrink-0 overflow-hidden"
                >
                  <img src={photo.url} alt="" className="h-full w-full object-cover" />
                </SquircleSurface>
              ))}
            </div>
          )}
        </>
      )}
      {failed && !editing && (
        <p className="mt-2 text-sm font-bold text-red-600" role="alert">
          {t('recordsSaveFailed')}
        </p>
      )}
      <PhotoLightbox
        photos={lightbox !== null ? stamp.photos.map((p) => p.url) : null}
        index={lightbox ?? 0}
        onIndexChange={setLightbox}
        onClose={() => setLightbox(null)}
      />
    </SquircleSurface>
  );
}

export default function RecordsPage() {
  const { t } = useSettings();
  const { session } = useSession();
  const { data: stamps = [], isLoading } = useMyStamps();
  const { data: favoriteIds = [] } = useMyFavoriteIds();
  const { data: allSites = [] } = useSites({ limit: 300 });
  const favoriteSitesRaw = useMemo(() => {
    if (favoriteIds.length === 0) return [];
    const order = new Map(favoriteIds.map((id, index) => [id, index]));
    return allSites
      .filter((site) => order.has(site.id))
      .sort((a, b) => order.get(a.id)! - order.get(b.id)!);
  }, [allSites, favoriteIds]);
  const favoriteSites = useLocalizedSites(favoriteSitesRaw);

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      {/* 2026-09-16 시안: 제목은 명조, 설명은 16px. 여권·인증서 영역은 없다(재기획에서 뺌). */}
      <PageHeader title={t('recordsMinimalTitle')} />

      {/* 비회원: 무엇을 할 수 있는 곳인지만 보여주고 로그인으로 안내한다. 탐색은 로그인 없이 된다. */}
      {!session ? (
        <Card padded={false}>
          <EmptyState
            icon={PenLine}
            title={t('recordsLoginTitle')}
            description={t('recordsLoginDescription')}
            action={
              <>
                <ButtonLink to={paths.login} id="records-login-btn">
                  {t('login')}
                </ButtonLink>
                <ButtonLink to={paths.search} variant="secondary">
                  <Search size={18} aria-hidden />
                  {t('findShrines')}
                </ButtonLink>
              </>
            }
          />
        </Card>
      ) : (
        <>
          <ButtonLink
            to={paths.search}
            variant="secondary"
            block
            className="mb-3 min-h-14 text-lg"
            id="records-pick-site"
          >
            <Plus size={22} aria-hidden />
            {t('recordsPickSite')}
          </ButtonLink>

          {!SUBMISSION_MODE && favoriteSites.length > 0 && (
            // 즐겨찾기는 아직 방문하지 않은 성지를 기록 화면에서 바로 다시 찾는 입구다.
            <section className="mb-6" aria-labelledby="records-favorites-heading">
              <div className="mb-3 flex items-center gap-2">
                <Heart size={18} className="fill-pink-500 text-pink-500" aria-hidden />
                <h2
                  id="records-favorites-heading"
                  className="text-base font-extrabold text-app-text"
                >
                  {t('favorites')}
                </h2>
              </div>
              <Card padded={false}>
                <ul className="divide-y divide-app-border" aria-label={t('favorites')}>
                  {favoriteSites.map((site) => (
                    <li key={site.id} className="px-5 py-4 first:pt-5 last:pb-5">
                      <SiteListItem site={site} />
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}

          {isLoading ? (
            <div className="space-y-3" role="status" aria-live="polite">
              {[1, 2, 3].map((i) => (
                <SquircleSurface key={i} className="h-24 animate-pulse bg-white" />
              ))}
            </div>
          ) : stamps.length === 0 ? (
            <Card padded={false}>
              <EmptyState
                icon={Calendar}
                title={t('recordsEmptyTitle')}
                description={t('recordsPickHint')}
              />
            </Card>
          ) : (
            <ul className="space-y-3" aria-label={t('recordsMinimalTitle')}>
              {stamps.map((stamp) => (
                <RecordItem key={stamp.stampId} stamp={stamp} />
              ))}
            </ul>
          )}
        </>
      )}
    </PageContainer>
  );
}
