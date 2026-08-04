import { Church } from 'lucide-react';

interface SiteThumbnailProps {
  imageUrl: string | null;
  name: string;
  className?: string;
  /** 이미지가 없을 때 보여줄 대체 표시 */
  fallback?: 'emoji' | 'icon';
  emojiSizeClass?: string;
}

/** 성지 사진이 아직 없는 곳이 많아, 빈 이미지 처리를 한 곳에서 통일한다. */
export function SiteThumbnail({
  imageUrl,
  name,
  className = '',
  fallback = 'emoji',
  emojiSizeClass = 'text-3xl',
}: SiteThumbnailProps) {
  if (imageUrl) {
    return <img src={imageUrl} alt={name} className={className} loading="lazy" />;
  }
  return fallback === 'emoji' ? (
    <span className={`${emojiSizeClass} opacity-30`} aria-hidden>
      ⛪
    </span>
  ) : (
    <Church size={28} className="text-gray-300" aria-hidden />
  );
}
