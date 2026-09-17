import { Check, Copy, MapPin } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/shared/i18n/use-settings';
import { SectionHeading } from '@/shared/components/ui/SectionHeading';
import { copyText } from '@/shared/lib/map-links';
import type { HolySite } from '@/shared/types/domain';
import { QuickDirectionsButtons } from './QuickDirectionsButtons';

/**
 * 찾아가는 길.
 *
 * 외국인 방문자를 기준으로 설계했다. 한국에서 길을 찾는 데 실제로 막히는 지점은 셋이다.
 *
 *  1. 구글 지도로 자동차 길찾기가 안 나온다 (국내 지도 반출 규제)
 *  2. 카카오·네이버가 정확한데 앱이 깔려 있지 않다
 *  3. 택시를 타면 영어 주소가 통하지 않는다
 *
 * 그래서 지도 앱을 하나로 몰지 않고 나란히 두고(`QuickDirectionsButtons` — 주변 본당
 * 목록과 같은 작은 단추), 무엇보다 **한국어 주소를 크게 보여준다.** 택시 기사에게
 * 화면을 보여주는 것이 외국인에게는 가장 확실한 길찾기다.
 *
 * 한국어·영문 주소를 언어 설정과 무관하게 늘 함께 보여준다(2026-09-17) — 영어 화면에서만
 * 영문 주소를 보여주면, 한국어 화면을 쓰는 한국인이 외국인 동행에게 영문 표기를 보여줄
 * 방법이 없었다.
 */
export function DirectionsCard({
  site,
  addressEnglish = null,
}: {
  site: HolySite;
  /** 영문(로마자) 주소. 있으면 한국어 주소 아래에 작게 병기한다. */
  addressEnglish?: string | null;
}) {
  const { t, language } = useSettings();
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const { lat, lng } = site.coordinates;
  const hasCoordinates = lat != null && lng != null;

  const handleCopy = async (text: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      setCopyError(false);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError(true);
    }
  };

  return (
    <section aria-labelledby="directions-heading">
      <SectionHeading as="h3" size="md" id="directions-heading" title={t('directions')} />

      {/* 주소 — 한국어를 택시 기사에게 보여줄 수 있게 크게, 영문은 그 아래 작게 병기.
          Copy 단추는 주소와 같은 줄에 둔다(2026-09-17) — 예전엔 위 별도 줄의 작은
          라벨과만 나란했다. */}
      <div className="mb-4 rounded-lg border border-app-border bg-app-bg p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="select-all text-xl font-bold leading-relaxed text-app-text" lang="ko">
              {site.location}
            </p>
            {addressEnglish && (
              <p className="mt-1 text-base leading-relaxed text-app-text-muted">
                {addressEnglish}
              </p>
            )}
          </div>
          <button
            onClick={() => void handleCopy(site.location)}
            className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-app-border bg-white px-3 text-sm font-bold text-app-text-muted transition-colors hover:border-brand-blue hover:text-brand-blue"
            aria-label={`${t('addressKorean')} — ${copied ? t('copied') : 'Copy'}`}
            aria-live="polite"
          >
            {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
            {copied ? t('copied') : 'Copy'}
          </button>
        </div>

        {/* 영어 화면일 때만 이 주소가 왜 한국어인지 설명한다 */}
        {language !== 'ko' && (
          <p className="mt-2 text-sm leading-relaxed text-app-text-muted">{t('addressHint')}</p>
        )}

        {copyError && (
          <p className="mt-2 text-sm text-app-text-muted" role="status">
            {t('copyFailed')}
          </p>
        )}
      </div>

      {/* 지도 앱 — 주변 본당 목록과 같은 작은 단추로(2026-09-17). 앱 이름만 보이고
          설명은 길게 누르면(title) 나온다 — 큰 상자·화살표 아이콘 같은 군더더기를 뺐다 */}
      {hasCoordinates ? (
        <QuickDirectionsButtons destination={{ name: site.name, lat, lng }} siteName={site.name} />
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-app-border bg-white px-5 py-4">
          <MapPin size={20} className="shrink-0 text-app-text-muted" aria-hidden />
          <p className="text-base leading-relaxed text-app-text-muted">{t('noCoordinates')}</p>
        </div>
      )}
    </section>
  );
}
