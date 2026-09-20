import type { TranslationKey } from '@/shared/i18n/dictionary';
import type { CrowdLevel } from '../api/stamps.repository';

/** 체감 붐빔 → 화면 말. 기록 목록과 선택 칩이 같은 말을 쓰게 한 곳에 둔다. */
export const CROWD_LEVEL_LABEL_KEY: Record<CrowdLevel, TranslationKey> = {
  quiet: 'crowdQuiet',
  moderate: 'crowdModerate',
  crowded: 'crowdCrowded',
};
