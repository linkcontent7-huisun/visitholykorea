/**
 * 대표 사진의 출처 한 줄 — 화면 오른쪽 아래에 아주 작게 붙는다 (T-032, 2026-09-21).
 *
 * 표기가 **의무**인 사진만 남긴다: 위키미디어(CC BY·CC BY-SA)와 공공누리(출처 표시 조건)처럼
 * 라이선스가 요구하는 것. 우리가 직접 찍었거나 앱에 쓰라고 받은 사진은 사진을 가리지 않게
 * 아무것도 붙이지 않는다(사장님 지적 2026-09-21: "너무 크게 나오니 사진 보기 싫더라").
 *
 * 값은 `holy_sites.image_source`·`image_license` 그대로가 아니라 줄여 쓴다 —
 * "노희선 직접 촬영 (2026-09-17) · 앱 사용 동의" 같은 작업 메모는 이용자에게 뜻이 없다.
 */

/** 직접 촬영·앱 사용 허락 사진 — 표기하지 않는다. */
const OWN_PATTERNS = [/직접 촬영/, /자체 촬영/, /노희선/, /앱 사용 (허락|동의)/];

/** 괄호 속 날짜·작업 메모를 떼어 낸 짧은 출처 이름 */
function shortSource(source: string): string {
  return source
    .replace(
      /\((?:[^()]*\d{4}-\d{2}-\d{2}[^()]*|촬영[^()]*|contentId[^()]*|recommendIdx[^()]*)\)/g,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/** 라이선스 이름을 짧게 — "공공누리 제1유형 (KOGL Type 1)" → "공공누리 제1유형" */
function shortLicense(license: string): string {
  return license.replace(/\s*\([^)]*\)/g, '').trim();
}

export function photoCreditText(
  imageSource: string | null | undefined,
  imageLicense: string | null | undefined,
): string | null {
  const source = imageSource?.trim() ?? '';
  const license = imageLicense?.trim() ?? '';
  if (!source && !license) return null;
  if (OWN_PATTERNS.some((re) => re.test(source) || re.test(license))) return null;
  const parts = [shortSource(source), shortLicense(license)].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : null;
}
