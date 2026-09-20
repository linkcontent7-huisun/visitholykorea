import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '@/shared/i18n/use-settings';

/**
 * 「← 뒤로」 — 모든 화면이 같은 모양·같은 자리(제목 위)에 둔다 (2026-09-17 화면 규칙).
 *
 * 전에는 화면마다 달랐다: 큰 꺾쇠만 있는 것, 화살표+글자, 흰 유리 단추, 홈으로 가는 링크.
 * 50대 이상은 아이콘만 있으면 무엇인지 확신하지 못하므로 **글자를 항상 같이** 쓴다.
 * `to` 를 주면 그 화면으로, 없으면 브라우저 뒤로가기. 누름 영역은 44px 이상.
 *
 * 🔴 성지 상세는 사진 위에 뜨는 별도 아이콘 전용 단추(화살표만, 글자 없음)를 따로 갖고
 * 있었다 — 뒤로 버튼이 두 종류로 보인다는 지적(2026-09-19)으로 여기 합쳤다. `variant="onDark"`
 * 가 그 자리를 대신한다(투명 헤더용 `TextSizePicker`·`LanguagePicker` 의 같은 패턴).
 */
export function BackButton({
  to,
  onClick,
  label,
  className = '',
  variant = 'default',
}: {
  to?: string;
  /** `to` 가 없을 때 기본 동작(브라우저 뒤로가기) 대신 쓸 함수. 정리(reset)가 필요한 화면에서만 */
  onClick?: () => void;
  /** 기본은 「뒤로」. 홈으로 보낼 때는 「홈으로」처럼 목적지를 적는다 */
  label?: string;
  className?: string;
  /** 사진 위에 투명하게 뜰 때(성지 상세 히어로) */
  variant?: 'default' | 'onDark';
}) {
  const navigate = useNavigate();
  const { t } = useSettings();
  const text = label ?? t('back');
  const base =
    'inline-flex min-h-11 items-center gap-1.5 rounded-lg text-base font-bold transition-colors';
  const cls =
    variant === 'onDark'
      ? `${base} border border-white/30 bg-black/30 px-3 text-white backdrop-blur-md hover:bg-black/45 focus-visible:outline-white ${className}`
      : `${base} -ml-2 gap-1 px-2 text-app-text-muted hover:bg-app-bg hover:text-app-text ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} id="back-button">
        <ArrowLeft size={20} aria-hidden />
        {text}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick ?? (() => navigate(-1))}
      className={cls}
      id="back-button"
    >
      <ArrowLeft size={20} aria-hidden />
      {text}
    </button>
  );
}
