import { BookOpen, Heart } from 'lucide-react';
import { isWydVenue, WYD_LABEL } from '@/features/passport/lib/wyd';
import { NearbyCrowdingLabel } from '@/features/crowding/components/CrowdingLabel';
import { SiteThumbnail } from '@/features/sites/components/SiteThumbnail';
import { photoCreditText } from '@/features/sites/lib/photo-credit';
import type { TranslatedSiteView } from '@/features/sites/lib/translated-site';
import { BackButton } from '@/shared/components/ui/BackButton';
import { SquircleSurface } from '@/shared/components/ui/SquircleSurface';
import { localizeDomainValue, localizeRegionName } from '@/shared/i18n/domain-labels';
import { useSettings } from '@/shared/i18n/use-settings';
import { sizedImageUrl } from '@/shared/lib/image-url';
import type { HolySite } from '@/shared/types/domain';

interface SiteHeroProps {
  site: HolySite;
  view: TranslatedSiteView | null;
  heroPhoto: { url: string | null; fromPilgrim: boolean };
  isFavorited: boolean;
  favoritePending: boolean;
  onToggleFavorite: () => void;
  /** 「기록으로 가기」 — 순례 기록 절로 스크롤 */
  onRecordAnchor: () => void;
}

/** 성지 상세 맨 위 사진 영역 — 사진·출처·뒤로·기록 앵커·즐겨찾기·이름·태그 (#102 에서 페이지에서 떼어 냄) */
export function SiteHero({
  site,
  view,
  heroPhoto,
  isFavorited,
  favoritePending,
  onToggleFavorite,
  onRecordAnchor,
}: SiteHeroProps) {
  const { language, t } = useSettings();
  const tags = [site.emotionTag, localizeRegionName(site.region, language), site.category].filter(
    (tag): tag is string => Boolean(tag),
  );
  const photoCredit = photoCreditText(site.imageSource, site.imageLicense, language);

  return (
    // 사진 높이는 화면의 절반 — 상단바(60px)를 뺀 나머지에서 잰다
    <div className="relative flex h-[min(55vh,520px)] w-full items-center justify-center overflow-hidden bg-app-bg">
      {heroPhoto.url ? (
        <>
          {/* 확대되며 나타나는 연출을 없앴다(사장님 지적, 2026-09-17) — 사진이 바로 보인다 */}
          <img
            // 화면 첫 그림(LCP) — 휴대폰엔 960px 이면 충분. 1280px 원본은 Lighthouse LCP 11초를 만들었다(9/14)
            src={sizedImageUrl(heroPhoto.url, 960)}
            alt={heroPhoto.fromPilgrim ? `${site.name} — ${t('photoFromPilgrim')}` : site.name}
            className="h-full w-full object-cover"
            fetchPriority="high"
            decoding="async"
          />
          {/* 순례자 사진은 누가 보내준 것인지 밝힌다 — 공식 사진과 같아 보이면 안 된다 */}
          {heroPhoto.fromPilgrim && (
            <span className="absolute bottom-2 right-3 rounded bg-black/40 px-2 py-0.5 text-xs text-white/85 backdrop-blur-sm">
              {t('photoFromPilgrim')}
            </span>
          )}
          {/* 사진 출처 — 위키미디어(CC BY)·공공누리는 표기가 의무라 남기되, 사진을 가리지 않게
                오른쪽 아래 아주 작게(사장님 지적 2026-09-21). 우리가 직접 찍은 사진은 표기하지 않는다. */}
          {!heroPhoto.fromPilgrim && photoCredit && (
            <span className="absolute bottom-1 right-1.5 rounded-sm bg-black/35 px-1.5 py-0.5 text-[0.625rem] leading-none text-white/70">
              {photoCredit}
            </span>
          )}
        </>
      ) : (
        <SiteThumbnail
          imageUrl={null}
          name={site.name}
          category={site.category}
          intensity="deep"
          className="h-full w-full"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
      {/*
          글자가 놓이는 아래쪽만 한 겹 더 어둡게 깐다.
          위 그라디언트는 가운데가 투명해서, 명동대성당처럼 하늘·나무·계단이
          밝게 나온 사진에서는 흰 글씨가 배경에 묻혔다 — 주소 두 줄이 서로
          겹쳐 보인다는 신고가 여기서 나왔다(2026-09-07 영어 모드 실측).
          사진을 통째로 어둡게 하지 않고 글자 자리만 덮는다.
        */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

      {/* 화살표만 있는 전용 단추 대신 다른 화면과 같은 「← 뒤로」를 쓴다(사장님 지적,
            2026-09-19: "뒤로 버튼 종류가 두 가지로 보인다") — 사진 위라 onDark 로만 다르다. */}
      <BackButton variant="onDark" className="absolute left-5 top-5" />

      <div className="absolute right-5 top-5 flex items-center gap-2">
        {/* 기록이 이 서비스의 핵심 기능인데도 이야기·도슨트 아래로 밀려 접근하기 어렵다는
              지적(사장님, 2026-09-20)으로, 즐겨찾기 옆에 「기록으로 가기」 앵커를 둔다. */}
        <SquircleSurface
          as="button"
          type="button"
          onClick={onRecordAnchor}
          borderColor="transparent"
          className="flex min-h-11 items-center gap-1.5 bg-transparent px-3 text-base font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)] transition-colors hover:bg-white/15"
        >
          <BookOpen size={18} aria-hidden />
          {t('siteRecordAnchor')}
        </SquircleSurface>
        {/* 즐겨찾기는 정식 기능(9/20) — 제출판에서도 보인다. 사진 위 세 단추는 배경 없이 글자·아이콘만(사장님 지적 9/21). */}
        <button
          onClick={onToggleFavorite}
          disabled={favoritePending}
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-transparent text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] transition-colors hover:bg-white/15"
          aria-label={isFavorited ? t('favoriteRemove') : t('favoriteAdd')}
          aria-pressed={isFavorited}
        >
          <Heart
            size={22}
            className={isFavorited ? 'fill-pink-500 text-pink-500' : undefined}
            aria-hidden
          />
        </button>
      </div>

      <div className="absolute bottom-10 left-5 right-5 text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.55)] lg:left-8 lg:right-8">
        <span className="inline-block rounded-full bg-brand-blue px-3 py-1 text-xs font-bold">
          {localizeDomainValue(site.category, t)}
        </span>
        {/* WYD 2027 공식 일정지 — 해외 청년 20~30만 명이 오는 확정 행사다 */}
        {isWydVenue(site.name) && (
          <span className="ml-2 inline-block rounded-full bg-amber-400/90 px-3 py-1 text-xs font-bold text-amber-950">
            {WYD_LABEL[language]}
          </span>
        )}
        <h1 className="mb-3 mt-3 font-display text-[2rem] leading-tight lg:text-[2.5rem]">
          {view?.name ?? site.name}
        </h1>
        {/* 주소는 삭제 — 「찾아가는 길」에 한국어·영문 병기로 이미 나온다(2026-09-17 사장님 지적) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 인근 밀집도 라벨 — 조회 중에는 분석 상태를, 완료되면 하·중·상을 표시한다 */}
          <NearbyCrowdingLabel site={site} labelMode="density" variant="onDark" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold backdrop-blur-md"
            >
              #{localizeDomainValue(tag, t)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
