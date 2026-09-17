import { useState } from 'react';
import { resolveStampMotif } from '@/features/passport/lib/stamp-motifs';
import { StampMotifIcon } from '@/features/passport/components/StampMotifIcon';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import { sizedImageUrl } from '@/shared/lib/image-url';

interface SiteThumbnailProps {
  imageUrl: string | null;
  name: string;
  /**
   * 순례자가 올린 승인 사진. 공식 사진이 없을 때 이 사진이 자리를 채우고,
   * "순례자가 보내온 사진"임을 대체 텍스트에 밝힌다.
   *
   * 이 컴포넌트는 데이터를 직접 조회하지 않는다 — 목록·상세 어디서나
   * 프로바이더 없이 렌더할 수 있어야 하기 때문이다. 조회는 화면이 한다
   * (`useFeaturedPhotos`).
   */
  pilgrimUrl?: string | null;
  /** 분류에 따라 대체 화면의 색·상징이 달라진다. 없으면 성당 취급. */
  category?: string | null;
  className?: string;
  /**
   * 대체 화면의 색 농도.
   * `deep` 은 상세 화면의 큰 배경용 — 그 위에 **흰 글씨**가 얹히므로 진한 색이어야 한다.
   * 밝은 색으로 두면 제목이 배경에 묻혀 읽히지 않는다 (2026-08-28 실제 화면에서 확인).
   */
  intensity?: 'light' | 'deep';
  /** @deprecated 예전 이모지 대체 시절의 속성 — 호환을 위해 남겨두었고 더 이상 쓰지 않는다. */
  fallback?: 'emoji' | 'icon';
  /** @deprecated 위와 같음. */
  emojiSizeClass?: string;
}

/**
 * 성지 대표 이미지. 사진이 없는 곳(2026-09-16 기준 208곳 중 119곳)은
 * 분류별 색 판 + 여권 스탬프 도장으로 채운다.
 * 사진처럼 보이게 속이지 않으면서도, 준비 안 된 화면으로 보이지 않게 하는 절충이다.
 */
interface 대체표시 {
  from: string;
  to: string;
  tone: string;
  /** 진한 판(상세 화면 배경)의 그라데이션 */
  deepFrom: string;
  deepTo: string;
}

const 기본표시: 대체표시 = {
  from: '#EFF4FF',
  to: '#DBE5FA',
  tone: '#1e3a8a',
  deepFrom: '#1e3a8a',
  deepTo: '#3b5bb5',
};

const 분류별: Record<string, 대체표시> = {
  순교성지: {
    from: '#F5F0FF',
    to: '#E4D9FA',
    tone: '#7c3aed',
    deepFrom: '#4c1d95',
    deepTo: '#7c3aed',
  },
  성당: 기본표시,
  주교좌성당: {
    from: '#EFF4FF',
    to: '#D3DFF7',
    tone: '#1e3a8a',
    deepFrom: '#1e3a8a',
    deepTo: '#3b5bb5',
  },
  순례길: {
    from: '#EFFAF3',
    to: '#D9F0E1',
    tone: '#15803d',
    deepFrom: '#14532d',
    deepTo: '#15803d',
  },
  역사사적지: {
    from: '#F4F6F8',
    to: '#E2E7EC',
    tone: '#475569',
    deepFrom: '#334155',
    deepTo: '#5b6b80',
  },
  교우촌: {
    from: '#FFF8EC',
    to: '#F8EAD0',
    tone: '#b45309',
    deepFrom: '#78350f',
    deepTo: '#b45309',
  },
  공소: {
    from: '#FFF8EC',
    to: '#F8EAD0',
    tone: '#b45309',
    deepFrom: '#78350f',
    deepTo: '#b45309',
  },
};

export function SiteThumbnail({
  imageUrl,
  name,
  pilgrimUrl = null,
  category,
  className = '',
  intensity = 'light',
}: SiteThumbnailProps) {
  const { t } = useSettings();
  // 사진이 "없는" 것과 "있는데 못 받은" 것은 다르다(재기획 §13). 못 받으면 그 사실을 적은 자리지킴이를 그린다.
  const [downloadFailed, setDownloadFailed] = useState(false);
  const usingPilgrim = !imageUrl && Boolean(pilgrimUrl);
  const url = imageUrl ?? pilgrimUrl;

  if (url && !downloadFailed) {
    return (
      <img
        // 카드·목록용이라 800px 이면 2배 밀도 휴대폰에서도 충분하다 — Wikimedia 1280px 을 그대로 받지 않는다.
        // Wikimedia 주소는 sizedImageUrl 이 허용 표준 폭(960)으로 올려 요청한다 — 800 그대로 보내면 400 (2026-09-16).
        src={sizedImageUrl(url, 800)}
        decoding="async"
        // 순례자 사진임을 스크린리더에도 알린다 — 공식 사진과 같은 것으로 읽히면 안 된다
        alt={usingPilgrim ? fillPlaceholders(t('photoByPilgrimAlt'), { name }) : name}
        className={className}
        loading="lazy"
        onError={() => setDownloadFailed(true)}
      />
    );
  }

  if (url && downloadFailed) {
    return (
      <div
        role="img"
        aria-label={fillPlaceholders(t('photoLoadFailedAlt'), { name })}
        className={`flex items-center justify-center bg-app-panel text-center text-xs font-bold text-app-text-muted ${className}`}
      >
        <span className="px-2">{t('photoLoadFailedLabel')}</span>
      </div>
    );
  }

  // 사진이 없으면 분류별 색 판 위에 여권과 같은 스탬프 도장을 그린다.
  // 사진이 아니라는 게 한눈에 보여 다른 성지 사진으로 오해될 일이 없고(교구 대표 사진은 그래서 뺐다 — 2026-09-16 사장님 결정),
  // 도장은 건축이 확인된 성지만 이름으로 그리고 나머지는 분류 상징이라 더미가 아니다.
  const 표시 = 분류별[category ?? ''] ?? 기본표시;
  const deep = intensity === 'deep';
  const background = deep
    ? `linear-gradient(135deg, ${표시.deepFrom} 0%, ${표시.deepTo} 100%)`
    : `linear-gradient(135deg, ${표시.from} 0%, ${표시.to} 100%)`;

  return (
    <div
      role="img"
      aria-label={fillPlaceholders(t('photoPendingAlt'), { name })}
      className={`flex items-center justify-center ${className}`}
      style={{ background }}
    >
      {/* 도장은 은은하게 — 사진 흉내가 아니라 자리를 지키는 문양이다 */}
      <StampMotifIcon
        motif={resolveStampMotif(name, category ?? null)}
        className={
          deep
            ? 'h-[46%] w-[46%] max-h-52 max-w-52 min-h-5 min-w-5 text-white opacity-20'
            : 'h-[58%] w-[58%] max-h-24 max-w-24 min-h-5 min-w-5 opacity-60'
        }
        style={deep ? undefined : { color: 표시.tone }}
      />
    </div>
  );
}
