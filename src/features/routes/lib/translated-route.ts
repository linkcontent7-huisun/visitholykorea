/**
 * 순례 코스 콘텐츠 번역 겹치기 — `features/sites/lib/translated-site.ts` 와 같은 규칙이다.
 *
 * 번역은 부분적일 수 있다. 제목만 있고 설명이 비어 있으면 그 칸은 한국어
 * 원문이 그대로 나온다 — 빈 화면보다 한국어가 낫다는 원칙.
 */

import { FALLBACK_CHAIN, type Language } from '@/shared/i18n/dictionary';
import type { PilgrimageRoute } from '@/shared/types/domain';

export interface RouteTranslation {
  title: string | null;
  subtitle: string | null;
  description: string | null;
}

export interface TranslatedRouteView {
  title: string;
  subtitle: string | null;
  description: string | null;
}

function filled(value: string | null | undefined): string | null {
  const v = (value ?? '').trim();
  return v === '' ? null : v;
}

/** 여러 언어의 코스 번역을 폴백 순서대로 겹쳐 한 벌로 만든다. */
export function resolveRouteTranslation(
  byLanguage: Partial<Record<Language, RouteTranslation | null>>,
  language: Language,
): RouteTranslation | null {
  if (language === 'ko') return null;

  const order: Language[] = [language, ...(FALLBACK_CHAIN[language] ?? [])].filter(
    (lang) => lang !== 'ko',
  );
  const pick = (field: keyof RouteTranslation): string | null => {
    for (const lang of order) {
      const value = filled(byLanguage[lang]?.[field]);
      if (value) return value;
    }
    return null;
  };

  const resolved: RouteTranslation = {
    title: pick('title'),
    subtitle: pick('subtitle'),
    description: pick('description'),
  };
  return Object.values(resolved).some(Boolean) ? resolved : null;
}

export function applyRouteTranslation(
  route: Pick<PilgrimageRoute, 'title' | 'subtitle' | 'description'>,
  translation: RouteTranslation | null,
): TranslatedRouteView {
  return {
    title: filled(translation?.title) ?? route.title,
    subtitle: filled(translation?.subtitle) ?? route.subtitle,
    description: filled(translation?.description) ?? route.description,
  };
}
