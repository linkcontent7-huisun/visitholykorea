import { ExternalLink } from 'lucide-react';
import { fillPlaceholders } from '@/shared/i18n/dictionary';
import { useSettings } from '@/shared/i18n/use-settings';
import type { OfficialLink } from '../lib/official-trails';

/**
 * 순례길 공식 누리집으로 나가는 단추.
 *
 * 운영 주체 이름은 누리집 표기(한국어) 그대로라 한국어 화면에서만 보인다 —
 * 다른 언어 화면에 한국어 기관명을 섞지 않는다.
 */
export function OfficialSiteLink({ link }: { link: OfficialLink }) {
  const { t, language } = useSettings();
  return (
    <div className="mt-4">
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-3 text-base font-bold text-white transition-colors hover:bg-brand-blue/90"
      >
        <ExternalLink size={16} aria-hidden />
        {t('routeOfficialSite')}
      </a>
      {language === 'ko' && (
        <p className="mt-2 text-sm text-app-text-muted">
          {fillPlaceholders(t('routeOfficialBy'), { owner: link.owner })}
        </p>
      )}
    </div>
  );
}
