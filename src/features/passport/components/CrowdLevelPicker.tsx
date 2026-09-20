import { Chip } from '@/shared/components/ui/Chip';
import { useSettings } from '@/shared/i18n/use-settings';
import { CROWD_LEVELS, type CrowdLevel } from '../api/stamps.repository';
import { CROWD_LEVEL_LABEL_KEY } from '../lib/crowd-level-label';

/**
 * 「그날 붐볐나요?」 — 한적 · 보통 · 붐빔 중 하나. 같은 칩을 다시 누르면 푼다(안 고른 상태로 저장).
 *
 * 관광공사 집중률은 예측이라 실제와 맞는지 대조할 실측이 없었다(2026-09-21 검토). 다녀온 사람의
 * 체감 한 칸이 그 실측이다. 질문은 부담이 없어야 하므로 필수가 아니고, 설명도 한 줄뿐이다.
 */
export function CrowdLevelPicker({
  value,
  onChange,
  name = 'crowdLevel',
}: {
  value: CrowdLevel | null;
  onChange: (next: CrowdLevel | null) => void;
  name?: string;
}) {
  const { t } = useSettings();
  return (
    <fieldset className="mt-3">
      <legend className="text-sm font-bold text-app-text-muted">
        {t('recordsCrowdTitle')}
        <span className="ml-2 font-normal">{t('recordsCrowdOptional')}</span>
      </legend>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('recordsCrowdTitle')}>
        {CROWD_LEVELS.map((level) => (
          <Chip
            key={level}
            name={name}
            active={value === level}
            aria-pressed={value === level}
            onClick={() => onChange(value === level ? null : level)}
          >
            {t(CROWD_LEVEL_LABEL_KEY[level])}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
