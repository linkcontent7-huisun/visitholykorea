import { dioceseLabel, localizeRegionName } from '@/shared/i18n/domain-labels';
import { regionOfAddress } from '@/shared/lib/regions';
import { fixKoreanTypedInEnglish } from '@/shared/lib/keyboard-hangul';
import type { HolySite } from '@/shared/types/domain';

/**
 * 성지 찾기의 자체 목록 매칭 — 서버 없이도 되는 부분.
 *
 * 대소문자·공백·하이픈·괄호 차이를 무시한다. "Myeong-dong" 과 "myeongdong", "충남"과
 * "충청남도(주소 원문)" 처럼 사람마다 다르게 적는 것을 같은 검색으로 본다.
 * 영문 성지 **이름**은 번역 테이블에만 있어 여기서는 못 찾는다 — 그건 서버 검색(`searchSites`)이
 * 맡고, 화면이 두 결과를 합친다.
 */
export function normalizeSearchText(text: string): string {
  return text.toLowerCase().replace(/[\s\-_·,()]/g, '');
}

/**
 * 검색어 후보 — 원문과, 한/영 전환을 잊고 친 경우의 한글(「audehdtjdekd」→「명동성당」).
 * 쌍자음(Shift)을 살리려고 정규화 **전** 원문으로 바꾼다 (2026-10-14 사장님).
 */
export function searchNeedles(rawQuery: string): string[] {
  const plain = normalizeSearchText(rawQuery);
  const fixed = normalizeSearchText(fixKoreanTypedInEnglish(rawQuery));
  return fixed && fixed !== plain ? [plain, fixed] : [plain];
}

/**
 * 사람들이 흔히 부르는 이름들 — DB 의 정식 이름과 다르게 부른다 (2026-10-29 운영 실측).
 * 「명동성당」은 「명동대성당」에, 「답동성당」은 「답동주교좌성당」에, 「해미성지」는 「해미순교성지」에
 * 걸리지 않아 결과가 비었다. 정식 이름에서 대·주교좌·순교를 뗀 이름과 「성지성당」→「성지」/「성당」도 같이 찾는다.
 */
export function nameAliases(name: string): string[] {
  const n = normalizeSearchText(name);
  const plain = n.replace(/주교좌대성당|주교좌성당|대성당/g, '성당');
  const out = new Set([n, plain]);
  for (const v of [n, plain]) {
    out.add(v.replace(/순교성지|순교지/g, '성지'));
    out.add(v.replace(/성지성당/g, '성지'));
    out.add(v.replace(/성지성당/g, '성당'));
  }
  return [...out];
}

/** 검색어(정규화된 값)와 맞는 성지인가 — 이름·주소·교구(한/영)·시도(한/영). */
export function siteMatchesQuery(site: HolySite, needle: string): boolean {
  if (!needle) return true;
  const region = regionOfAddress(site.location);
  const haystack = [
    site.name,
    ...nameAliases(site.name),
    site.location,
    site.region,
    localizeRegionName(site.region, 'en'),
    dioceseLabel(site.region, 'ko'),
    dioceseLabel(site.region, 'en'),
    region ?? '',
    region ? localizeRegionName(region, 'en') : '',
  ]
    .map(normalizeSearchText)
    .join('|');
  return haystack.includes(needle);
}
