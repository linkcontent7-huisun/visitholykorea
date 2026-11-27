import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { getMyStamps, isVisitedOnAvailable } from '@/features/passport/api/stamps.repository';
import {
  RecordPhotoTray,
  shrinkPending,
  usePendingPhotos,
} from '@/features/passport/components/RecordPhotoTray';
import { useAddStamp, useUploadStampPhotos } from '@/features/passport/hooks/use-stamps';
import { resolveReflectionQuestion } from '@/features/passport/lib/reflection-questions';
import { normalizeNote, NOTE_MAX_LENGTH } from '@/features/passport/lib/stamp-note';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { useSettings } from '@/shared/i18n/use-settings';
import { koreaTodayIso } from '@/shared/lib/korea-date';
import type { HolySite } from '@/shared/types/domain';

/**
 * 아직 한 줄을 남기지 않은 사람의 기록 입력 칸 — 한 줄·방문일·붐빔·사진 3장.
 * 저장 한 번이 기록(스탬프)도 함께 만든다. (#102 에서 SiteDetailPage 에서 떼어 냄)
 */
export function NoteComposer({ site }: { site: HolySite }) {
  const navigate = useNavigate();
  const { language, t } = useSettings();
  const siteId = site.id;
  const addStamp = useAddStamp(siteId);
  const uploadPhotos = useUploadStampPhotos(siteId);

  const [noteDraft, setNoteDraft] = useState('');
  // 방문일 — 기본값은 오늘(기록하는 날)이지만, 지난 방문을 나중에 적는 경우도 있어
  // 날짜 선택을 열어둔다(사장님 지적, 2026-09-20: "무조건 기록한 날짜로 고정이다").
  const [visitedOnDraft, setVisitedOnDraft] = useState(() => koreaTodayIso());
  // 기록 입력 아코디언 — 처음엔 펼쳐 두고, 「다음에요」를 누르면 접는다(2026-09-17).
  // 접어도 사라지지 않는다 — 줄만 남아서 다시 누르면 펼칠 수 있다.
  const [noteComposerOpen, setNoteComposerOpen] = useState(true);
  // 기록과 함께 올릴 사진 — 세 기록 칸이 같은 부품(RecordPhotoTray)을 쓴다(2026-11-22)
  const tray = usePendingPhotos(0);
  const draftKey = `vhk.noteDraft.${siteId}`;
  const [draftRestored, setDraftRestored] = useState(false);
  // 로그인 없이 쓰고 「남기기」를 눌러 로그인 화면에 다녀오면 쓴 글이 사라졌다(점검 영역 A·C, 2026-11-22).
  // 로그인 화면으로 가기 전에 글을 이 기기(탭)에 잠깐 두었다가, 돌아오면 되살린다. 사진 파일은 둘 수 없다.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return;
      sessionStorage.removeItem(draftKey);
      const d = JSON.parse(raw) as { note?: string; visitedOn?: string };
      if (d.note) setNoteDraft(d.note);
      if (d.visitedOn) setVisitedOnDraft(d.visitedOn);
      setDraftRestored(true);
    } catch {
      // 저장소를 못 쓰는 브라우저 — 되살리지 못할 뿐 기록은 그대로 쓸 수 있다
    }
  }, [draftKey]);

  /**
   * 기록 저장 — 이 한 번의 호출이 "기록"(스탬프)도 함께 만든다(2026-09-17).
   * 예전엔 "스탬프 찍기" 버튼을 먼저 눌러야 기록을 쓸 수 있었다. 그 절차가
   * 이 화면의 유일한 "기록" 입구인데도 무겁게 느껴진다는 지적으로, 절차를 화면에
   * 드러내지 않고 기록 쓰기 한 번으로 합쳤다 — addStamp 자체는 그대로다
   * (처음 쓰면 새 기록을 만들고, 이미 있으면 한 줄만 갱신한다).
   */
  const handleSaveNote = () => {
    const note = normalizeNote(noteDraft);
    if (!note) return;
    addStamp.mutate(
      {
        note,
        visitedOn: isVisitedOnAvailable() ? visitedOnDraft : null,
      },
      {
        onSuccess: async (result) => {
          if (!result.success) {
            if (result.error === 'UNAUTHENTICATED') {
              try {
                sessionStorage.setItem(
                  draftKey,
                  JSON.stringify({ note: noteDraft, visitedOn: visitedOnDraft }),
                );
              } catch {
                // 되살리기만 못 한다
              }
              navigate(paths.login);
              return;
            }
            window.alert(t('saveFailedNote'));
            return;
          }
          // 기록과 같이 고른 사진이 있으면 이어서 올린다 — stamp 는 방금 생겼으므로
          // (myStamps 캐시가 아직 갱신 전일 수 있어) 직접 다시 조회해 stampId 를 얻는다.
          if (tray.pending.length > 0) {
            const photos = await shrinkPending(tray.pending);
            tray.clear();
            const fresh = await getMyStamps();
            const stampId = fresh.find((s) => s.siteId === siteId)?.stampId;
            // 예전에는 실패해도 아무 말이 없었다(Codex 점검 D) — 글은 저장됐으니 사진만 다시 올리게 알린다
            const uploaded = stampId
              ? await uploadPhotos.mutateAsync({ stampId, photos })
              : { success: false };
            if (!uploaded.success) window.alert(t('photoUploadFailed'));
          }
        },
      },
    );
  };

  return (
    <Card padded={false}>
      <button
        type="button"
        onClick={() => setNoteComposerOpen((open) => !open)}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={noteComposerOpen}
      >
        <span className="text-base font-bold text-app-text">{t('noteAskTitle')}</span>
        <ChevronDown
          size={20}
          className={`shrink-0 text-app-text-muted transition-transform ${
            noteComposerOpen ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {noteComposerOpen && (
        <div className="px-5 pb-5">
          {/* 오늘의 질문 — 빈 입력창은 쓰기 어렵지만 질문에는 답하게 된다. */}
          <blockquote className="border-l-2 border-brand-blue/40 pl-3 text-sm font-medium leading-relaxed text-brand-blue">
            {language === 'ko'
              ? resolveReflectionQuestion(site.name, site.category).ko
              : resolveReflectionQuestion(site.name, site.category).en}
          </blockquote>
          <p className="mt-2 text-sm leading-relaxed text-app-text-muted">{t('noteHint')}</p>
          <SquircleSurface
            borderColor="var(--color-app-input-border)"
            borderClassName="transition-colors group-focus-within:stroke-brand-blue group-focus-within:stroke-[6px]"
            className="group mt-3 overflow-hidden bg-white"
          >
            <input
              type="text"
              name="note"
              autoComplete="off"
              maxLength={NOTE_MAX_LENGTH}
              placeholder={t('notePlaceholder')}
              aria-label={t('noteAriaLabel')}
              className="min-h-12 w-full bg-transparent px-4 text-base text-app-text focus-visible:outline-none"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              // 휴대폰 자판의 「완료·이동」도 Enter 라, 예전에는 사진을 고르기 전에 저장되고 칸이 닫혔다.
              // 저장은 「남기기」 단추로만 한다(2026-11-22).
              enterKeyHint="next"
            />
          </SquircleSurface>
          {/* 방문일 — 기본은 오늘(기록하는 날), 지난 방문을 나중에 적을 때는 고른다 */}
          {isVisitedOnAvailable() && (
            <label className="mt-3 block text-sm font-bold text-app-text-muted">
              {t('recordsVisitedOn')}
              <SquircleSurface
                borderColor="var(--color-app-border)"
                className="mt-1 overflow-hidden bg-white"
              >
                <input
                  type="date"
                  value={visitedOnDraft}
                  max={koreaTodayIso()}
                  onChange={(e) => setVisitedOnDraft(e.target.value)}
                  className="block min-h-12 w-full bg-transparent px-3 text-base text-app-text"
                />
              </SquircleSurface>
            </label>
          )}
          {/* 사진 — 한 기록에 3장. 기록 문장과 함께 한 번에 올라간다 */}
          <div className="mt-3">
            <RecordPhotoTray tray={tray} disabled={addStamp.isPending} />
          </div>
          {draftRestored && (
            <p className="mt-2 text-sm text-brand-blue" role="status">
              {t('noteDraftRestored')}
            </p>
          )}
          <p className="mt-3 text-sm leading-relaxed text-app-text-muted">
            {t('reviewPublicNotice')}
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setNoteComposerOpen(false)}>
              {t('noteLater')}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveNote}
              disabled={normalizeNote(noteDraft) === null || addStamp.isPending}
            >
              {addStamp.isPending ? t('noteSubmitting') : t('noteSubmit')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
