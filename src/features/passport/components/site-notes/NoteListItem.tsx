import { Flag, PenLine, User } from 'lucide-react';
import type { SiteVisitNote } from '@/features/passport/api/stamps.repository';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { SPEECH_LOCALE } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';

interface NoteListItemProps {
  note: SiteVisitNote;
  isMine: boolean;
  reported: boolean;
  onEdit: () => void;
  onReport: () => void;
  onOpenPhoto: (photos: string[], index: number) => void;
}

/** 「기록 모두 보기」의 한 줄 — 내 것엔 수정, 남의 것엔 신고 단추 (#102 에서 SiteDetailPage 에서 떼어 냄) */
export function NoteListItem({
  note: n,
  isMine,
  reported,
  onEdit,
  onReport,
  onOpenPhoto,
}: NoteListItemProps) {
  const { language, t } = useSettings();
  return (
    <li className="border-l-2 border-brand-blue/30 pl-3">
      {/* 실명 대신 일반 라벨만 — "누가"는 DB 조회에 아예 없다(비식별 설계) */}
      <div className="mb-1.5 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand-blue"
          aria-hidden
        >
          <User size={14} />
        </span>
        <span className="text-sm font-bold text-app-text">
          {isMine ? t('noteMine') : t('pilgrimDefaultName')}
        </span>
      </div>
      {n.photos.length > 0 && (
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
          {n.photos.map((url, i) => (
            <SquircleSurface
              as="button"
              key={url}
              type="button"
              onClick={() => onOpenPhoto(n.photos, i)}
              aria-label={t('photoEnlarge')}
              className="block h-36 w-36 shrink-0 overflow-hidden"
            >
              <img
                src={url}
                alt={t('pilgrimPhotoAlt')}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </SquircleSurface>
          ))}
        </div>
      )}
      {n.note && <p className="text-base leading-relaxed text-app-text">&ldquo;{n.note}&rdquo;</p>}
      <div className="mt-1 flex items-center justify-between">
        <p className="text-sm text-app-text-muted">
          {new Date(n.visitedAt).toLocaleDateString(SPEECH_LOCALE[language], {
            month: 'long',
            day: 'numeric',
          })}{' '}
          {t('visitedLabel')}
        </p>
        {isMine ? (
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-app-text-muted transition-colors hover:bg-app-bg hover:text-app-text"
            aria-label={t('recordsEdit')}
          >
            <PenLine size={14} aria-hidden />
            {t('recordsEdit')}
          </button>
        ) : (
          // 운영자가 한 명뿐이라 신고 3건이면 자동으로 가려진다
          <button
            onClick={onReport}
            disabled={reported}
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-bold text-app-text-muted transition-colors hover:bg-app-bg hover:text-app-text disabled:opacity-40"
            aria-label={t('reportAction')}
          >
            <Flag size={14} aria-hidden />
            {reported ? t('reportedAction') : t('reportAction')}
          </button>
        )}
      </div>
    </li>
  );
}
