/**
 * 성지 콘텐츠 번역 겹치기.
 *
 * 번역은 부분적일 수 있다 — 이름만 있고 역사가 비어 있으면 그 칸은
 * 한국어가 그대로 나온다. 빈 영어 화면보다 한국어가 낫다는 원칙.
 * 주소는 번역하지 않고 로마자 병기만 한다 (택시 기사에게 통해야 한다).
 */

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
