import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { recordNoteReads } from '@/features/passport/api/stamps.repository';
import { useMyStamp, useReportNote, useSiteNotes } from '@/features/passport/hooks/use-stamps';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { PhotoLightbox } from '@/shared/components/ui/PhotoLightbox';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { useSettings } from '@/shared/i18n/use-settings';
import type { HolySite } from '@/shared/types/domain';
import { MyNoteEditor } from './MyNoteEditor';
import { NoteComposer } from './NoteComposer';
import { NoteListItem } from './NoteListItem';

/* 순례 기록 — "스탬프 찍기" 절차를 없앴다(2026-09-17 사장님 지적). 로그인한 사람은
    누구나 바로 한 줄을 남길 수 있고, 그 글이 이 성지의 첫 기록이면 스탬프(기록)가
    뒤에서 함께 남는다. 사진은 확대해서 가로로 넘겨 보고, 다른 사람 글에는 실명 대신
    일반 라벨("순례자")만 붙인다 — 누가 썼는지는 DB 조회 자체에 없다(비식별 설계 유지). */
export function SiteNotesSection({ site }: { site: HolySite }) {
  const { t } = useSettings();
  const siteId = site.id;
  const { data: myStamp } = useMyStamp(siteId);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const { data: visitNotes = [] } = useSiteNotes(siteId, reviewsOpen ? undefined : 6);
  const reportNote = useReportNote(siteId);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());
  // 사진 확대 모달 — 「내가 남긴」·「다른 순례자」 사진 둘 다 이 상태 하나를 같이 쓴다
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [editingMyNote, setEditingMyNote] = useState(false);
  const openPhoto = (photos: string[], index: number) => setLightbox({ photos, index });

  const handleReport = (stampId: string) => {
    if (!window.confirm(t('reportConfirm'))) return;
    setReportedIds((prev) => new Set(prev).add(stampId));
    reportNote.mutate(stampId);
  };

  // "다녀온 사람의 한 줄"이 실제로 화면에 보였을 때만 읽힘 수를 올린다.
  // 성지당 한 번 — 리렌더마다 세면 조회수가 아니라 렌더 횟수가 된다.
  const readRecordedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!siteId || visitNotes.length === 0) return;
    if (readRecordedRef.current.has(siteId)) return;
    readRecordedRef.current.add(siteId);
    void recordNoteReads(siteId, visitNotes.length);
  }, [siteId, visitNotes.length]);

  return (
    <>
      <section aria-labelledby="reviews-heading" className="space-y-4">
        <SectionHeading
          id="reviews-heading"
          title={t('reviewsTitle').replace('{count}', String(visitNotes.length))}
          sub={t('pilgrimStoriesHint')}
        />

        {/* 아코디언 — 처음엔 펼쳐 두고, 「다음에요」를 누르면 접는다(2026-09-17).
              닫혀도 이 줄은 그대로 있어서, 마음이 바뀌면 다시 눌러 펼칠 수 있다. */}
        {!myStamp?.note && <NoteComposer site={site} />}

        {/* 「기록 모두 보기」 목록 — 내 것도 여기 함께 보인다. 내 것만 신고 대신 수정
              단추가 붙는다(2026-09-20 사장님 지적: "내가 남긴 한 줄"과 여기가 같은 내용을
              중복해서 보여줬다 — 별도 카드를 없애고 이 목록 하나로 합쳤다). */}
        {visitNotes.length > 0 && (
          <Card>
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReviewsOpen((open) => !open)}
                className="-mr-3 -mt-1 text-brand-blue"
                aria-expanded={reviewsOpen}
              >
                {reviewsOpen ? t('reviewsHide') : t('reviewsShow')}
              </Button>
            </div>
            <ul className="space-y-5">
              {visitNotes.map((n) => {
                const isMine = myStamp?.id != null && n.id === myStamp.id;
                if (isMine && editingMyNote && myStamp) {
                  return (
                    <li key={n.id} className="border-l-2 border-brand-blue/30 pl-3">
                      <MyNoteEditor
                        siteId={siteId}
                        myStamp={myStamp}
                        onClose={() => setEditingMyNote(false)}
                        onOpenPhoto={openPhoto}
                      />
                    </li>
                  );
                }
                return (
                  <NoteListItem
                    key={n.id}
                    note={n}
                    isMine={isMine}
                    reported={reportedIds.has(n.id)}
                    onEdit={() => setEditingMyNote(true)}
                    onReport={() => handleReport(n.id)}
                    onOpenPhoto={openPhoto}
                  />
                );
              })}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-app-text-muted">
              {t('reviewModerationNotice')}
            </p>
          </Card>
        )}
      </section>
      {/* 사진 확대 — 화면 전체를 덮는 fixed 요소라, 부모의 space-y 여백을 받지 않게 body 로 띄운다 */}
      {createPortal(
        <PhotoLightbox
          photos={lightbox?.photos ?? null}
          index={lightbox?.index ?? 0}
          onIndexChange={(index) => setLightbox((prev) => (prev ? { ...prev, index } : prev))}
          onClose={() => setLightbox(null)}
        />,
        document.body,
      )}
    </>
  );
}
