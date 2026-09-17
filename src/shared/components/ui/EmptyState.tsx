import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * 비어 있음 · 결과 없음 · 불러오지 못함 — 한 가지 모양 (2026-09-17 화면 규칙).
 *
 * 전에는 화면마다 점선 카드·회색 아이콘·가운데 글자를 따로 그렸다. 여기로 모은다.
 * 제목 18px·설명 16px — 50대 이상이 읽는 크기. `action` 에 「다시 시도」「성지 찾기」 버튼을 넣는다.
 * 오류일 때는 호출부가 `role="alert"` 를, 조회 결과가 없을 뿐이면 `role="status"` 를 붙인다.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  compact = false,
  role,
  id,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** 카드 안에 들어갈 때 — 위아래 여백을 줄인다 */
  compact?: boolean;
  role?: 'status' | 'alert';
  id?: string;
}) {
  return (
    <div className={`px-5 text-center ${compact ? 'py-8' : 'py-14'}`} role={role} id={id}>
      {Icon && (
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-app-panel text-app-text-muted"
          aria-hidden
        >
          <Icon size={28} />
        </div>
      )}
      <div className="text-lg font-bold text-app-text">{title}</div>
      {description && (
        <div className="mx-auto mt-2 max-w-md whitespace-pre-line text-base leading-relaxed text-app-text-muted">
          {description}
        </div>
      )}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
