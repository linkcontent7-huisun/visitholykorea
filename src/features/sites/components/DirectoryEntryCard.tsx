import { Phone } from 'lucide-react';
import { useSettings } from '@/shared/i18n/use-settings';
import { localizeDomainValue } from '@/shared/i18n/domain-labels';
import { Card } from '@/shared/components/ui/Card';
import type { DirectoryEntry } from '../api/directory.repository';
import {
  directoryDisplayAddress,
  directoryDisplayName,
  formatDistanceKm,
  type NearbyPlace,
} from '../lib/nearby-directory';
import { QuickDirectionsButtons } from './QuickDirectionsButtons';

/**
 * 본당·공소 주소록 한 줄 — 가까운 성당 탭 · 지역 랜딩 · 오늘의 성지 일정 · 검색 결과 · 성지 상세 주변 본당이 함께 쓴다.
 *
 * 다섯 화면에 같은 마크업이 복사돼 있었고(2026-09-17 정리 전), 전화 단추 크기·거리 표기·
 * 길찾기 줄 유무가 조금씩 달랐다. 이름 · 분류 칩 · 주소 · 거리 · 전화 · 길찾기 순서로 고정한다.
 * 전화 단추는 44px — 목록에서 가장 자주 누르는 것이 전화다.
 *
 * `bare` 면 카드 테두리 없이 그린다(이미 카드 안에 있는 목록용).
 */
export function DirectoryEntryCard({
  entry,
  distanceKm,
  showDirections = true,
  bare = false,
  hideDistance = false,
  hideCategory = false,
}: {
  /** 반경 검색 결과(`NearbyPlace`, 거리 있음)든 검색 결과(`DirectoryEntry`)든 같은 줄로 그린다 */
  entry: DirectoryEntry | NearbyPlace;
  /** 넘기면 오른쪽에 거리를 적는다. `entry.distanceKm` 이 있으면 그것을 쓴다 */
  distanceKm?: number | null;
  showDirections?: boolean;
  bare?: boolean;
  /** 거리를 아예 안 보여준다(성지 상세의 주변 본당 — 성지 이름만으로 충분하다는 지적) */
  hideDistance?: boolean;
  /** 분류 칩을 안 보여준다. 목록이 전부 같은 분류(예: 본당·공소)일 때, 줄마다 같은 말이
   *  반복되는 게 정보가 아니라 피로였다(사장님 지적, 2026-09-17) */
  hideCategory?: boolean;
}) {
  const { t, language } = useSettings();
  const displayName = directoryDisplayName(entry, language);
  const displayAddress = directoryDisplayAddress(entry, language);
  const km = hideDistance
    ? null
    : (distanceKm ?? ('distanceKm' in entry ? entry.distanceKm : null));
  const hasCoords = entry.lat != null && entry.lng != null;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="break-keep text-base font-bold text-app-text">{displayName}</span>
            {!hideCategory && (
              <span className="shrink-0 rounded-full bg-app-panel px-2 py-0.5 text-xs font-bold text-app-text-muted">
                {localizeDomainValue(entry.category, t)}
              </span>
            )}
          </p>
          {displayAddress && (
            <p className="mt-1 break-keep text-sm text-app-text-muted">{displayAddress}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {km != null && (
            <span className="text-sm font-bold tabular-nums text-app-text-muted">
              {formatDistanceKm(km)}
            </span>
          )}
          {entry.phone && (
            <a
              href={`tel:${entry.phone.replace(/[^0-9+]/g, '')}`}
              aria-label={`${entry.name} ${t('callPhone')}`}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-app-panel text-brand-blue transition-colors hover:bg-brand-soft"
            >
              <Phone size={18} aria-hidden />
            </a>
          )}
        </div>
      </div>
      {showDirections && hasCoords && (
        <div className={`mt-3 ${bare ? '' : 'border-t border-app-border pt-3'}`}>
          <QuickDirectionsButtons
            destination={{ name: displayName, lat: entry.lat as number, lng: entry.lng as number }}
            siteName={displayName}
          />
        </div>
      )}
    </>
  );

  if (bare) return <div>{body}</div>;
  return (
    <Card padded className="p-4">
      {body}
    </Card>
  );
}
