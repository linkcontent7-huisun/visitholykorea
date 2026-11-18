import type { Language } from '@/shared/i18n/dictionary';
import { KO_NAME_ALIASES } from '../data/baptism-name-aliases';
import { BAPTISM_NAMES, type BaptismName } from '../data/baptism-names';

/**
 * 세례명 목록을 「한국 성인 5분 + 세례명 가나다순」으로 묶는다 (사장님 결정 2026-11-15).
 *
 * 예전에는 버튼이 150개(세례명 74 + 한국 성인 76)였고, 성인은 성씨부터 써서 같은 베드로 성인 12분이
 * 권·남·손·유…로 흩어졌다. 이제 성인은 같은 세례명 카드 안 「이 이름의 한국 성인」으로 모으고,
 * 세례명으로 실제로 많이 부르는 다섯 분만 맨 위에 따로 둔다.
 */
export const FEATURED_SAINT_SLUGS = [
  'Andrew-Kim-Dae-geon',
  'Paul-Jeong-Ha-sang',
  'Francis-Choi-Gyeong-hwan',
  'Peter-Yu-Dae-cheol',
  'Elizabeth-Jeong-Jeong-hye',
] as const;

export interface BaptismOption {
  slug: string;
  kind: BaptismName['kind'];
  label: string;
}

/** 성인 카드 slug 는 「세례명-성-이름」이라 앞부분이 세례명 카드 slug 다 (예: Peter-Yu-Dae-cheol → Peter) */
export function nameSlugOf(entry: Pick<BaptismName, 'slug' | 'kind'>): string {
  return entry.kind === 'saint' ? (entry.slug.split('-')[0] ?? entry.slug) : entry.slug;
}

/**
 * 맨 위 버튼용 이름. 한국어는 「대건 안드레아」처럼 성을 빼고 부른다(세례명으로 부르는 모양 그대로).
 * 외국어는 성을 빼면 누구인지 알기 어려워 원래 표기를 둔다.
 */
export function featuredLabel(entry: BaptismName, language: Language): string {
  const full = entry.names[language];
  // 다섯 분 모두 성이 한 글자다(김·정·최·유·정). 두 글자 성(남궁 등) 성인을 넣으면 여기를 고친다.
  return language === 'ko' ? full.slice(1) : full;
}

/** 한국어 세례명 버튼은 많이 쓰는 다른 표기를 괄호로 붙인다 — 「체칠리아(세실리아)」 (2026-11-19) */
function nameLabel(n: BaptismName, language: Language): string {
  const alias = language === 'ko' && n.kind !== 'saint' ? KO_NAME_ALIASES[n.slug] : undefined;
  return alias ? `${n.names[language]}(${alias})` : n.names[language];
}

const option = (n: BaptismName, language: Language): BaptismOption => ({
  slug: n.slug,
  kind: n.kind,
  label: nameLabel(n, language),
});

export function featuredSaints(language: Language): BaptismOption[] {
  return FEATURED_SAINT_SLUGS.flatMap((slug) => {
    const n = BAPTISM_NAMES.find((x) => x.slug === slug);
    return n ? [{ ...option(n, language), label: featuredLabel(n, language) }] : [];
  });
}

/** 세례명 카드(같은 이름의 한국 성인이 있든 없든) 전부를 그 언어 가나다(알파벳)순으로 */
export function sortedNames(language: Language): BaptismOption[] {
  return BAPTISM_NAMES.filter((n) => n.kind !== 'saint')
    .map((n) => option(n, language))
    .sort((a, b) => a.label.localeCompare(b.label, language));
}

/** 그 세례명을 가진 한국 성인들 (성인 이름 가나다순) */
export function saintsOfName(nameSlug: string, language: Language): BaptismOption[] {
  return BAPTISM_NAMES.filter((n) => n.kind === 'saint' && nameSlugOf(n) === nameSlug)
    .map((n) => option(n, language))
    .sort((a, b) => a.label.localeCompare(b.label, language));
}

/**
 * 검색: 세례명 자체가 맞거나, 그 세례명의 성인 이름이 맞으면 보여 준다
 * (「대철」을 치면 베드로 카드가 남는다). 띄어쓰기·대소문자는 가리지 않는다.
 */
export function filterNames(
  names: BaptismOption[],
  query: string,
  language: Language,
): BaptismOption[] {
  const q = normalize(query);
  if (!q) return names;
  return names.filter(
    (n) =>
      normalize(n.label).includes(q) ||
      saintsOfName(n.slug, language).some((s) => normalize(s.label).includes(q)),
  );
}

const normalize = (s: string) => s.toLocaleLowerCase().replace(/\s+/g, '');
