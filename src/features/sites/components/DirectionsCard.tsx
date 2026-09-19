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
 * 지도 앱을 하나로 몰지 않고 나란히 두고(`QuickDirectionsButtons` — 주변 본당
 * 목록과 같은 작은 단추: 카카오맵·티맵·네이버지도, 국내 실사용 순), 무엇보다
 * **한국어 주소를 크게 보여준다.** 구글·애플 지도는 국내에서는 거의 안 쓰여
 * 코드 전체에서 뺐다(사장님 지적, 2026-09-19 — `shared/lib/map-links.ts` 참고).
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

      {/* 주소 — 더 단순하게(사장님 지적, 2026-09-17). 상자·배경을 걷어내고 글자만 크게 둔다.
          Copy 는 아이콘 하나로 — 글자 라벨은 뺐다(뜻은 aria-label 로 남긴다). */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="select-all text-xl font-bold leading-relaxed text-app-text" lang="ko">
            {site.location}
          </p>
          {addressEnglish && (
            <p className="mt-1 text-base leading-relaxed text-app-text-muted">{addressEnglish}</p>
          )}
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
        <button
          onClick={() => void handleCopy(site.location)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-app-text-muted transition-colors hover:bg-app-bg hover:text-brand-blue"
          aria-label={`${t('addressKorean')} — ${copied ? t('copied') : 'Copy'}`}
          aria-live="polite"
        >
          {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
        </button>
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
