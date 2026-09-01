/**
 * 성지 콘텐츠 번역 겹치기.
 *
 * 번역은 부분적일 수 있다 — 이름만 있고 역사가 비어 있으면 그 칸은
 * 한국어가 그대로 나온다. 빈 영어 화면보다 한국어가 낫다는 원칙.
 * 주소는 번역하지 않고 로마자 병기만 한다 (택시 기사에게 통해야 한다).
 */

import { FALLBACK_CHAIN, type Language } from '@/shared/i18n/dictionary';
import type { HolySite } from '@/shared/types/domain';

export interface SiteTranslation {
  name: string | null;
  description: string | null;
  history: string | null;
  addressRomanized: string | null;
}

export interface TranslatedSiteView {
  name: string;
  description: string | null;
  history: string | null;
  /** 로마자 주소 — 있을 때만 원 주소 아래 병기 */
  addressRomanized: string | null;
}

function filled(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  return v === '' ? null : v;
}

/**
 * 여러 언어의 번역을 폴백 순서대로 겹쳐 한 벌로 만든다.
 *
 * 스페인어 순례자에게 "스페인어 번역이 없으니 한국어를 보시오"는 답이 아니다.
 * 영어를 한 단계 두면 최소한 읽을 수는 있다 — 영어는 208곳 전부 있다.
 * 칸 단위로 겹치므로 "스페인어 이름 + 영어 역사" 같은 조합도 자연스럽게 나온다.
 */
export function resolveTranslation(
  byLanguage: Partial<Record<Language, SiteTranslation | null>>,
  language: Language,
): SiteTranslation | null {
  if (language === 'ko') return null;

  const order: Language[] = [language, ...(FALLBACK_CHAIN[language] ?? [])].filter(
    (lang) => lang !== 'ko',
  );
  const pick = (field: keyof SiteTranslation): string | null => {
    for (const lang of order) {
      const value = filled(byLanguage[lang]?.[field]);
      if (value) return value;
    }
    return null;
  };

  const resolved: SiteTranslation = {
    name: pick('name'),
    description: pick('description'),
    history: pick('history'),
    addressRomanized: pick('addressRomanized'),
  };
  // 한 칸도 못 채웠으면 번역이 없는 것과 같다 — 호출부가 원문으로 폴백한다.
  return Object.values(resolved).some(Boolean) ? resolved : null;
}

export function applyTranslation(
  site: Pick<HolySite, 'name' | 'description' | 'history'>,
  translation: SiteTranslation | null,
): TranslatedSiteView {
  return {
    name: filled(translation?.name) ?? site.name,
    description: filled(translation?.description) ?? site.description ?? null,
    history: filled(translation?.history) ?? site.history ?? null,
    addressRomanized: filled(translation?.addressRomanized),
  };
}
