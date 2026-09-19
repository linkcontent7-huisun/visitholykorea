/**
 * 내 기록 — 최소 기능(재기획 2026-09-14 §6).
 *
 *   장소(성지 검색으로 고른다) · 방문일 · 짧은 메모 · 비공개 기본 · 수정 · 삭제
 *
 * 인증서 PDF·공유 카드·스탬프 장식·교구 진행률·공개 사진 선정은 이번 제출 범위에서 뺐다.
 * 코드(`features/passport/lib/*`)는 남아 있어 나중에 다시 붙일 수 있다.
 *
 * 기록의 정체는 `pilgrimage_stamps` 행 하나다. 장소를 고르는 입구는 성지 상세의
 * 「성지 기록 남기기」 버튼이고, 여기서는 목록·수정·삭제만 한다. 방문일(`visited_on`)은
 * 마이그레이션 20260914130000 이 운영 DB 에 적용된 뒤에만 편집할 수 있다 — 그 전에는
 * 열이 없다는 사실을 화면에 그대로 적는다.
 */

import { Calendar, MapPin, PenLine, Plus, Search, Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { useSession } from '@/features/auth/hooks/use-session';
import { isVisitedOnAvailable, type StampedSite } from '@/features/passport/api/stamps.repository';
import { useDeleteStamp, useMyStamps, useUpdateStamp } from '@/features/passport/hooks/use-stamps';
import { Button, ButtonLink } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { PageContainer } from '@/shared/components/ui/PageContainer';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { fillPlaceholders, SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { dioceseLabel } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';

function formatDate(value: string, locale: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function RecordItem({ stamp }: { stamp: StampedSite }) {
  const { t, language } = useSettings();
  const locale = SPEECH_LOCALE[language];
  const update = useUpdateStamp();
  const remove = useDeleteStamp();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(stamp.note ?? '');
  const [visitedOn, setVisitedOn] = useState(stamp.visitedOn ?? '');
  const [failed, setFailed] = useState(false);
  const canEditDate = isVisitedOnAvailable();

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

  return (
    <li className="rounded-lg border border-app-border bg-white p-5">
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
              <input
                type="date"
                name="visitedOn"
                value={visitedOn}
                onChange={(e) => setVisitedOn(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="mt-1 block min-h-12 w-full rounded-lg border border-app-border bg-white px-3 text-base text-app-text"
              />
            </label>
          ) : (
            <p className="text-sm leading-relaxed text-app-text-muted">
              {t('recordsVisitDateUnavailable')}
            </p>
          )}
          <label className="block text-sm font-bold text-app-text-muted">
            {t('recordsMemo')}
            <textarea
              value={note}
              name="note"
              onChange={(e) => setNote(e.target.value.slice(0, 120))}
              rows={3}
              maxLength={120}
              className="mt-1 block w-full rounded-lg border border-app-border bg-white px-3 py-2 text-base text-app-text"
            />
          </label>
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
                setVisitedOn(stamp.visitedOn ?? '');
              }}
            >
              {t('recordsCancel')}
            </Button>
          </div>
        </form>
      ) : (
        stamp.note && (
          <p className="mt-3 rounded-lg bg-app-bg px-4 py-3 text-base leading-relaxed text-app-text">
            {stamp.note}
          </p>
        )
      )}
      {failed && !editing && (
        <p className="mt-2 text-sm font-bold text-red-600" role="alert">
          {t('recordsSaveFailed')}
        </p>
      )}
    </li>
  );
}

export default function RecordsPage() {
  const { t } = useSettings();
  const { session } = useSession();
  const { data: stamps = [], isLoading } = useMyStamps();
  const displayName =
    (session?.user.user_metadata?.name as string | undefined) ||
    session?.user.email ||
    t('pilgrimDefaultName');

  return (
    <PageContainer width="narrow" className="min-h-page pb-16">
      {/* 2026-09-16 시안: 제목은 명조, 설명은 16px. 여권·인증서 영역은 없다(재기획에서 뺌). */}
      <PageHeader title={t('recordsMinimalTitle')} sub={t('recordsMinimalSub')} />

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
          {/* 로그인 상태를 첫 줄에 — 회의(9/16) "로그인 상태를 먼저 확인한다" */}
          <Card tone="soft" className="mb-4 flex items-center gap-3 p-4" id="records-signed-in">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-blue text-white"
              aria-hidden
            >
              <User size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-app-text">
                {fillPlaceholders(t('recordsLoggedInAs'), {
                  name: displayName,
                  count: stamps.length,
                })}
              </p>
              <p className="text-sm text-app-text-muted">{t('recordsLoggedInNote')}</p>
            </div>
          </Card>
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
          <p className="mb-4 text-sm leading-relaxed text-app-text-muted">{t('recordsPickHint')}</p>

          {isLoading ? (
            <div className="space-y-3" role="status" aria-live="polite">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-white" />
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

          <p className="mt-6 text-sm leading-relaxed text-app-text-muted">
            {t('recordsPrivateNote')}
          </p>
        </>
      )}
    </PageContainer>
  );
}
