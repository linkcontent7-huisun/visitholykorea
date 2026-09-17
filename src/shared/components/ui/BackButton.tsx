import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 「← 뒤로」 — 모든 화면이 같은 모양·같은 자리(제목 위)에 둔다 (2026-09-17 화면 규칙).
 *
 * 전에는 화면마다 달랐다: 큰 꺾쇠만 있는 것, 화살표+글자, 흰 유리 단추, 홈으로 가는 링크.
 * 50대 이상은 아이콘만 있으면 무엇인지 확신하지 못하므로 **글자를 항상 같이** 쓴다.
 * `to` 를 주면 그 화면으로, 없으면 브라우저 뒤로가기. 누름 영역은 44px 이상.
 */
export function BackButton({
  to,
  label,
  className = '',
}: {
  to?: string;
  /** 기본은 「뒤로」. 홈으로 보낼 때는 「홈으로」처럼 목적지를 적는다 */
  label?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const { t } = useSettings();
  const text = label ?? t('back');
  const cls = `-ml-2 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-base font-bold text-app-text-muted transition-colors hover:bg-app-bg hover:text-app-text ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} id="back-button">
        <ArrowLeft size={20} aria-hidden />
        {text}
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => navigate(-1)} className={cls} id="back-button">
      <ArrowLeft size={20} aria-hidden />
      {text}
    </button>
  );
}
