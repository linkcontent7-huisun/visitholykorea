import { Church, Cross, Footprints, Home, Landmark, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { dioceseImageFor, placeholderImageFor } from '@/shared/lib/site-placeholder';
import { dioceseLabel } from '@/shared/i18n/domain-labels';
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
  /**
   * 성지의 교구(`HolySite.region` — 교구가 없으면 광역지자체명이 오는데, 그건 표에 없어 임시 이미지로 간다). 사진이 없으면 그 교구의 대표 사진(주교좌성당)을 「○○교구 성지」 띠와 함께 보여준다.
   * 안 넘기면 예전처럼 임시 이미지. DB 의 image_url 은 건드리지 않는다 (task_IMAGE 작업 1).
   */
  diocese?: string | null;
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
 * 성지 대표 이미지. 사진이 없는 곳이 아직 많아(2026-08 기준 208곳 중 약 170곳),
 * 빈자리를 ⛪ 이모지 대신 분류별 색·상징이 있는 "디자인된 카드"로 채운다.
 * 사진처럼 보이게 속이지 않으면서도, 준비 안 된 화면으로 보이지 않게 하는 절충이다.
 */
interface 대체표시 {
  icon: LucideIcon;
  from: string;
  to: string;
  tone: string;
  /** 진한 판(상세 화면 배경)의 그라데이션 */
  deepFrom: string;
  deepTo: string;
}

const 기본표시: 대체표시 = {
  icon: Church,
  from: '#EFF4FF',
  to: '#DBE5FA',
  tone: '#1e3a8a',
  deepFrom: '#1e3a8a',
  deepTo: '#3b5bb5',
};

const 분류별: Record<string, 대체표시> = {
  순교성지: {
    icon: Cross,
    from: '#F5F0FF',
    to: '#E4D9FA',
    tone: '#7c3aed',
    deepFrom: '#4c1d95',
    deepTo: '#7c3aed',
  },
  성당: 기본표시,
  주교좌성당: {
    icon: Church,
    from: '#EFF4FF',
    to: '#D3DFF7',
    tone: '#1e3a8a',
    deepFrom: '#1e3a8a',
    deepTo: '#3b5bb5',
  },
  순례길: {
    icon: Footprints,
    from: '#EFFAF3',
    to: '#D9F0E1',
    tone: '#15803d',
    deepFrom: '#14532d',
    deepTo: '#15803d',
  },
  역사사적지: {
    icon: Landmark,
    from: '#F4F6F8',
    to: '#E2E7EC',
    tone: '#475569',
    deepFrom: '#334155',
    deepTo: '#5b6b80',
  },
  교우촌: {
    icon: Home,
    from: '#FFF8EC',
    to: '#F8EAD0',
    tone: '#b45309',
    deepFrom: '#78350f',
    deepTo: '#b45309',
  },
  공소: {
    icon: Home,
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
  diocese = null,
  className = '',
  intensity = 'light',
}: SiteThumbnailProps) {
  const { t, language } = useSettings();
  const [placeholderFailed, setPlaceholderFailed] = useState(false);
  const [dioceseFailed, setDioceseFailed] = useState(false);
  // 사진이 "없는" 것과 "있는데 못 받은" 것은 다르다(재기획 §13). 못 받으면 그 사실을 적은 자리지킴이를 그린다.
  const [downloadFailed, setDownloadFailed] = useState(false);
  const usingPilgrim = !imageUrl && Boolean(pilgrimUrl);
  const url = imageUrl ?? pilgrimUrl;

  if (url && !downloadFailed) {
    return (
      <img
        // 카드·목록용 960px — Wikimedia 가 정해진 크기(960·1280 등)만 내주고 800 은 400 오류라 카드가 전부 「불러오지 못했어요」였다 (2026-09-16 실측)
        src={sizedImageUrl(url, 960)}
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
        className={`flex items-center justify-center bg-gray-100 text-center text-[0.6875rem] font-bold text-gray-500 ${className}`}
      >
        <span className="px-2">{t('photoLoadFailedLabel')}</span>
      </div>
    );
  }

  // 교구 대표 사진 — 이 성지 사진이 아니므로 띠로 밝힌다. 작게, 왼쪽 아래, 사진을 가리지 않게 (사장님 지시 9/16).
  const dioceseImage = dioceseImageFor(diocese);
  if (dioceseImage && !dioceseFailed) {
    const dio = dioceseLabel(diocese ?? '', language);
    return (
      <span className="@container relative block h-full w-full">
        <img
          src={sizedImageUrl(dioceseImage.url, 960)}
          alt={fillPlaceholders(t('dioceseFallbackAlt'), { diocese: dio, label: dioceseImage.label })}
          className={className}
          loading="lazy"
          decoding="async"
          onError={() => setDioceseFailed(true)}
        />
        {intensity === 'deep' ? (
          // 상세 히어로 — 사진이 있을 때의 출처 표기와 같은 크기. 본문 흰 판이 히어로 아래 32px 를 덮으므로(-mt-8) 그 위에 놓는다. CC 계열은 출처 표기가 의무다
          <span className="absolute bottom-11 right-3 z-10 rounded bg-black/40 px-2 py-0.5 text-[0.625rem] text-white/80 backdrop-blur-sm">
            {fillPlaceholders(t('dioceseBand'), { diocese: dio })} · {dioceseImage.label} · {dioceseImage.source} · {dioceseImage.license}
          </span>
        ) : (
          // 목록의 56px 썸네일에서는 띠가 사진의 절반을 덮는다(9/16 실측 52%) — 목록 항목(96px) 이상에서만 그린다(96px 에서 약 11%). 대체 텍스트는 늘 있다
          <span className="pointer-events-none absolute bottom-1 left-1 z-10 hidden rounded bg-black/45 px-1.5 py-0.5 text-[0.6875rem] font-bold leading-tight whitespace-nowrap text-white/90 backdrop-blur-sm @[90px]:inline-block">
            {fillPlaceholders(t('dioceseBand'), { diocese: dio })}
          </span>
        )}
      </span>
    );
  }

  // 사진도 순례자 사진도 없으면 임시 이미지. "곧 현장 사진을 올릴 예정" 문구가
  // 이미지 안에 박혀 있어 진짜 사진으로 읽히지 않는다 (2026-09-12).
  // 분류별 문양 카드는 임시 이미지마저 못 불러왔을 때의 마지막 자리지킴이로 남긴다.
  if (!placeholderFailed) {
    return (
      <img
        src={placeholderImageFor(name)}
        alt={fillPlaceholders(t('photoPendingAlt'), { name })}
        className={className}
        loading="lazy"
        onError={() => setPlaceholderFailed(true)}
      />
    );
  }

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
      {/* 상징은 은은하게 — 사진 흉내가 아니라 자리를 지키는 문양이다 */}
      <표시.icon
        aria-hidden
        style={{
          color: deep ? '#ffffff' : 표시.tone,
          opacity: deep ? 0.16 : 0.28,
          width: deep ? '46%' : '34%',
          height: deep ? '46%' : '34%',
          maxWidth: deep ? 200 : 72,
          maxHeight: deep ? 200 : 72,
          minWidth: 20,
          minHeight: 20,
        }}
        strokeWidth={1.5}
      />
    </div>
  );
}
