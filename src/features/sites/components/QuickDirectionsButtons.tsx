import { Navigation } from 'lucide-react';
import { useSettings } from '@/shared/i18n/use-settings';
import { buildMapLinks, type Destination } from '@/shared/lib/map-links';

/**
 * 목록 행(검색 결과·지역 랜딩·주변 본당 카드)처럼 좁은 자리에서 쓰는 길찾기 버튼.
 *
 * 성지 상세의 `DirectionsCard` 는 지도 앱 4개(구글·애플·카카오·네이버)를 전부
 * 늘어놓지만, 목록 행 한 줄에는 그럴 자리가 없다. 대신 외국인 방문자가 실제로
 * 쓰는 두 축만 남긴다 — **안드로이드 기본(구글) + iOS 기본(애플)**.
 * 한국어 화면이면 `buildMapLinks` 가 카카오맵을 구글보다 앞에 두므로(한국에서
 * 구글은 자동차 길찾기가 안 된다 — `map-links.ts` 참고), 1번 버튼은 언어에 따라
 * 자동으로 바뀌고 애플 버튼은 항상 별도로 보장한다. 두 링크 모두 새 탭 실제
 * URL(`maps.apple.com`, `map.kakao.com`/`google.com/maps`)로 열리는 진짜
 * 길찾기다 — 자리표시자가 아니다.
 */
export function QuickDirectionsButtons({
  destination,
  siteName,
}: {
  destination: Destination;
  /** 접근성 라벨에 쓸 이름. destination.name 과 같을 때가 많지만 호출부가 명시한다. */
  siteName: string;
}) {
  const { t, language } = useSettings();
  const links = buildMapLinks(destination, language === 'ko');

  const primary = links[0];
  const apple = links.find((link) => link.provider === 'apple');

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {primary && (
        <a
          href={primary.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${siteName} — ${primary.label} ${t('directions')}`}
          title={`${primary.label} ${t('directions')}`}
          className="flex items-center gap-1 rounded-lg bg-app-bg px-2 py-1.5 text-[10px] font-bold text-brand-violet transition-colors hover:bg-brand-violet/10"
        >
          <Navigation size={12} aria-hidden />
          {primary.label}
        </a>
      )}
      {apple && apple.provider !== primary?.provider && (
        <a
          href={apple.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${siteName} — ${apple.label} ${t('directions')}`}
          title={`${apple.label} ${t('directions')}`}
          className="flex items-center gap-1 rounded-lg bg-app-bg px-2 py-1.5 text-[10px] font-bold text-brand-violet transition-colors hover:bg-brand-violet/10"
        >
          <Navigation size={12} aria-hidden />
          {apple.label}
        </a>
      )}
    </div>
  );
}
