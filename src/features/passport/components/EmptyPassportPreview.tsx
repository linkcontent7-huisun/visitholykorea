import { useQuery } from '@tanstack/react-query';
import { MapPin, Stamp as StampIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paths } from '@/app/routes/paths';
import { fetchSiteLocationIndex } from '@/features/sites/api/holy-sites.repository';
import { queryKeys } from '@/shared/api/query-keys';
import { haversineKm } from '@/shared/lib/geo';
import { regionCoords } from '@/shared/lib/regions';
import { useSettings } from '@/shared/i18n/use-settings';
import { resolveStampMotif } from '../lib/stamp-motifs';
import { StampMotifIcon } from './StampMotifIcon';

/**
 * 스탬프가 0개일 때의 여권 화면.
 *
 * 빈 화면에 "아직 없습니다"만 띄우면, 이 여권이 무엇을 모으는 물건인지
 * 알 수 없다. 그래서 **앞으로 어떤 도장이 찍히는지**를 회색 실루엣으로
 * 미리 보여준다.
 *
 * ⚠️ 이것은 실제 기록이 아니라 미리보기다. 화면에 그렇게 적는다 —
 * 가짜 스탬프를 진짜처럼 보이게 하는 순간 더미 데이터가 된다.
 */
export function EmptyPassportPreview() {
  const { origin } = useSettings();

  // 출발 지역이 설정돼 있으면 거기서 가장 가까운 성지를 첫 순례지로 제안한다.
  const coords = origin ? regionCoords(origin) : null;
  const { data: sites = [] } = useQuery({
    queryKey: queryKeys.sites.coordsIndex,
    queryFn: fetchSiteLocationIndex,
    enabled: coords !== null,
    staleTime: 1000 * 60 * 60,
  });

  const nearest =
    coords && sites.length > 0
      ? sites
          .map((s) => ({ ...s, km: haversineKm(coords.lat, coords.lng, s.lat, s.lng) }))
          .sort((a, b) => a.km - b.km)[0]
      : null;

  // 미리보기 도장 — 어떤 성지의 도장도 아니고, 분류가 만드는 대표 문양이다.
  const previewMotifs = [
    { motif: resolveStampMotif('', '순교성지'), label: '순교성지' },
    { motif: resolveStampMotif('', '주교좌성당'), label: '주교좌성당' },
    { motif: resolveStampMotif('', '순례길'), label: '순례길' },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-app-border bg-white p-8 text-center">
        <StampIcon size={28} className="mx-auto mb-4 text-brand-violet" />
        <h3 className="text-base font-extrabold text-app-text">아직 찍은 스탬프가 없어요</h3>
        <p className="mt-2 text-xs leading-relaxed text-app-text-muted">
          성지에 다녀와 스탬프를 찍으면, 그곳의 <strong>건축을 새긴 도장</strong>이 찍힙니다.
          잉크 색은 다녀온 날의 전례 시기가 정해요.
        </p>

        <div className="mt-7 flex items-end justify-center gap-6">
          {previewMotifs.map(({ motif, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-app-border text-app-text-muted/40">
                <StampMotifIcon motif={motif} className="h-9 w-9" />
              </div>
              <span className="text-[9px] font-bold text-app-text-muted/70">{label}</span>
            </div>
          ))}
        </div>
        {/* 미리보기임을 반드시 밝힌다 */}
        <p className="mt-4 text-[10px] font-bold text-app-text-muted/70">
          위 도장은 미리보기예요 — 아직 찍히지 않은 자리입니다
        </p>
      </div>

      {nearest && (
        <Link
          to={paths.siteDetail(nearest.id)}
          className="flex items-center gap-4 rounded-[24px] border border-brand-violet/20 bg-brand-violet/[0.04] p-6"
          id="nearest-site-suggestion"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-violet/10 text-brand-violet">
            <MapPin size={20} />
          </div>
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-violet">
              첫 순례지 제안
            </p>
            <p className="truncate text-sm font-extrabold text-app-text">{nearest.name}</p>
            <p className="text-xs font-bold text-app-text-muted">
              {origin}에서 약 {Math.round(nearest.km)}km
            </p>
          </div>
        </Link>
      )}

      {!origin && (
        <Link
          to={paths.menu}
          className="block rounded-[24px] border border-app-border bg-app-bg p-6 text-center text-xs font-bold text-app-text-muted"
        >
          출발 지역을 정해두면 가까운 성지를 먼저 알려드려요
        </Link>
      )}
    </div>
  );
}
