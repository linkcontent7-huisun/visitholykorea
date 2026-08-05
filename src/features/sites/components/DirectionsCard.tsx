import { Check, Copy, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/shared/i18n/use-settings';
import { buildMapLinks, copyText, formatCoordinates } from '@/shared/lib/map-links';
import type { HolySite } from '@/shared/types/domain';

/**
 * 찾아가는 길.
 *
 * 외국인 방문자를 기준으로 설계했다. 한국에서 길을 찾는 데 실제로 막히는 지점은 셋이다.
 *
 *  1. 구글 지도로 자동차 길찾기가 안 나온다 (국내 지도 반출 규제)
 *  2. 카카오·네이버가 정확한데 앱이 깔려 있지 않다
 *  3. 택시를 타면 영어 주소가 통하지 않는다
 *
 * 그래서 지도 앱을 하나로 몰지 않고 **각각 무엇을 잘하는지 밝혀서 나란히** 두고,
 * 무엇보다 **한국어 주소를 크게 보여준다.** 택시 기사에게 화면을 보여주는 것이
 * 외국인에게는 가장 확실한 길찾기다.
 */
export function DirectionsCard({ site }: { site: HolySite }) {
  const { t, language } = useSettings();
  const [copied, setCopied] = useState<'address' | 'coords' | null>(null);
  const [copyError, setCopyError] = useState(false);

  const { lat, lng } = site.coordinates;
  const hasCoordinates = lat != null && lng != null;

  const handleCopy = async (text: string, which: 'address' | 'coords') => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(which);
      setCopyError(false);
      setTimeout(() => setCopied(null), 2000);
    } else {
      setCopyError(true);
    }
  };

  // 한국어 화면이면 국내 지도 앱을 앞에 둔다
  const links = hasCoordinates
    ? buildMapLinks({ name: site.name, lat, lng }, language === 'ko')
    : [];

  return (
    <section aria-labelledby="directions-heading">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-6 w-1.5 rounded-full bg-brand-violet" />
        <h2 id="directions-heading" className="text-xl font-extrabold tracking-tight text-app-text">
          {t('directions')}
        </h2>
      </div>

      {/* 한국어 주소 — 이 화면에서 가장 중요한 요소라 가장 크게 둔다 */}
      <div className="mb-4 rounded-[24px] border border-app-border bg-app-bg p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-app-text-muted">
            {t('addressKorean')}
          </span>
          <button
            onClick={() => void handleCopy(site.location, 'address')}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-app-border bg-white px-3 py-1.5 text-[11px] font-bold text-app-text-muted transition-colors hover:border-brand-violet hover:text-brand-violet"
            aria-label={t('addressKorean')}
          >
            {copied === 'address' ? <Check size={13} /> : <Copy size={13} />}
            {copied === 'address' ? t('copied') : 'Copy'}
          </button>
        </div>

        {/* 택시 기사에게 보여줄 수 있도록 크고 선택 가능하게 */}
        <p className="select-all text-lg font-bold leading-relaxed text-app-text" lang="ko">
          {site.location}
        </p>

        {/* 영어 화면일 때만 이 주소가 왜 한국어인지 설명한다 */}
        {language !== 'ko' && (
          <p className="mt-2 text-[12px] leading-relaxed text-app-text-muted">{t('addressHint')}</p>
        )}

        {copyError && (
          <p className="mt-2 text-[11px] font-medium text-app-text-muted">{t('copyFailed')}</p>
        )}
      </div>

      {hasCoordinates ? (
        <>
          {/* 좌표 — 어떤 지도 앱에도 붙여넣을 수 있는 최후의 수단 */}
          <div className="mb-4 flex items-center justify-between gap-3 rounded-[20px] border border-app-border bg-white px-5 py-3">
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-app-text-muted">
                {t('coordinates')}
              </span>
              <p className="select-all font-mono text-[13px] text-app-text">
                {formatCoordinates(lat, lng)}
              </p>
            </div>
            <button
              onClick={() => void handleCopy(formatCoordinates(lat, lng), 'coords')}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-app-border px-3 py-1.5 text-[11px] font-bold text-app-text-muted transition-colors hover:border-brand-violet hover:text-brand-violet"
              aria-label={t('coordinates')}
            >
              {copied === 'coords' ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>

          <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-app-text-muted">
            {t('openInMapApp')}
          </p>

          {/* 하나로 몰지 않는다. 앱이 없는 사람이 막히면 안 된다 */}
          <div className="space-y-2">
            {links.map((link) => (
              <a
                key={link.provider}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-4 rounded-[20px] border border-app-border bg-white p-4 transition-colors hover:border-brand-blue/40"
                id={`map-${link.provider}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/5 text-brand-blue">
                  <Navigation size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-app-text">{link.label}</p>
                  <p className="text-[11px] leading-relaxed text-app-text-muted">
                    {t(link.noteKey)}
                  </p>
                </div>
                <ExternalLink size={15} className="shrink-0 text-gray-300" />
              </a>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-[20px] border border-dashed border-app-border bg-white px-5 py-4">
          <MapPin size={18} className="shrink-0 text-gray-300" />
          <p className="text-[12px] leading-relaxed text-app-text-muted">{t('noCoordinates')}</p>
        </div>
      )}
    </section>
  );
}
