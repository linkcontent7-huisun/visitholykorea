import { Church, Cross, Footprints, Home, Landmark, type LucideIcon } from 'lucide-react';

interface SiteThumbnailProps {
  imageUrl: string | null;
  name: string;
  /** 분류에 따라 대체 화면의 색·상징이 달라진다. 없으면 성당 취급. */
  category?: string | null;
  className?: string;
  /** @deprecated 예전 이모지 대체 시절의 속성 — 호환을 위해 남겨두었고 더 이상 쓰지 않는다. */
  fallback?: 'emoji' | 'icon';
  /** @deprecated 위와 같음. */
  emojiSizeClass?: string;
}

/**
 * 성지 대표 이미지. 사진이 없는 곳이 아직 많아(2026-08 기준 208곳 중 약 170곳),
 * 빈자리를 ⛪ 이모지 대신 분류별 색·상징이 있는 "디자인된 카드"로 채운다.
 * 사진처럼 보이게 속이지 않으면서도, 준비 안 된 화면으로 보이지 않게 하는 절충이다.
 */
interface 대체표시 {
  icon: LucideIcon;
  from: string;
  to: string;
  tone: string;
}

const 기본표시: 대체표시 = { icon: Church, from: '#EFF4FF', to: '#DBE5FA', tone: '#1e3a8a' };

const 분류별: Record<string, 대체표시> = {
  순교성지: { icon: Cross, from: '#F5F0FF', to: '#E4D9FA', tone: '#7c3aed' },
  성당: 기본표시,
  주교좌성당: { icon: Church, from: '#EFF4FF', to: '#D3DFF7', tone: '#1e3a8a' },
  순례길: { icon: Footprints, from: '#EFFAF3', to: '#D9F0E1', tone: '#15803d' },
  역사사적지: { icon: Landmark, from: '#F4F6F8', to: '#E2E7EC', tone: '#475569' },
  교우촌: { icon: Home, from: '#FFF8EC', to: '#F8EAD0', tone: '#b45309' },
  공소: { icon: Home, from: '#FFF8EC', to: '#F8EAD0', tone: '#b45309' },
};

export function SiteThumbnail({ imageUrl, name, category, className = '' }: SiteThumbnailProps) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={className} loading="lazy" />;
  }

  const { icon: Icon, from, to, tone } = 분류별[category ?? ''] ?? 기본표시;
  return (
    <div
      role="img"
      aria-label={`${name} — 사진 준비 중`}
      className={`flex items-center justify-center ${className}`}
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      {/* 상징은 은은하게 — 사진 흉내가 아니라 자리를 지키는 문양이다 */}
      <Icon
        aria-hidden
        style={{
          color: tone,
          opacity: 0.28,
          width: '34%',
          height: '34%',
          maxWidth: 72,
          maxHeight: 72,
          minWidth: 20,
          minHeight: 20,
        }}
        strokeWidth={1.5}
      />
    </div>
  );
}
