import { Navigation } from 'lucide-react';
import { useSettings } from '@/shared/i18n/use-settings';
import { buildMapLinks, type Destination } from '@/shared/lib/map-links';

/**
 * 목록 행(검색 결과·지역 랜딩·주변 본당 카드·나침반 결과)에서 쓰는 길찾기 버튼 묶음.
 *
 * 카카오맵만 있어서 안드로이드가 아닌 사람이 막힌다는 실기기 피드백(2026-09-08)
 * 으로, 하나로 줄이지 않고 `buildMapLinks` 가 주는 순서 그대로 전부 보여준다 —
 * 한국어 화면이면 카카오맵·티맵·네이버지도(실사용 순)가 앞에, 구글·애플이 뒤에
 * 온다. 성지 상세의 `DirectionsCard` 와 같은 데이터(`buildMapLinks`)를 쓰므로
 * 목록에서 보이는 순서와 상세 화면의 순서가 어긋나지 않는다. 전부 새 탭 실제
 * URL 로 열리는 진짜 길찾기다 — 자리표시자가 아니다.
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

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {links.map((link) => (
        <a
          key={link.provider}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${siteName} — ${link.label} ${t('directions')}`}
          title={`${link.label} — ${t(link.noteKey)}`}
          className="flex items-center gap-1 rounded-lg bg-app-bg px-2 py-1.5 text-[0.625rem] font-bold text-brand-violet transition-colors hover:bg-brand-violet/10"
        >
          <Navigation size={12} aria-hidden />
          {link.label}
        </a>
      ))}
    </div>
  );
}
