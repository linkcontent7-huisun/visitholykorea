/**
 * 소개글 끝에 붙은 「▷ 미사 시간(…)」 문단을 떼어낸다.
 *
 * 서울 성지 13곳의 미사 시간·연락처는 별도 칸이 없어 description 끝에 정해진 형식으로
 * 붙여 두었다(마이그레이션 20260912230000). 상세 화면은 소개글을 따옴표 인용문으로 보여주므로
 * 그 안에 시간표가 섞이면 읽기 어렵다 — 여기서 갈라 「방문 정보」의 카드로 따로 그린다.
 *
 * 형식: `▷ 미사 시간(2025-11-30 기준, 변경될 수 있음) — 주일: …｜평일: …｜문의: …｜비고: …`
 */
export interface MassInfo {
  /** "2025-11-30 기준, 변경될 수 있음" 같은 괄호 안 문구 */
  basis: string;
  rows: Array<{ label: string; value: string }>;
}

const MARKER = '▷ 미사 시간';

export function splitMassInfo(description: string | null | undefined): {
  body: string | null;
  mass: MassInfo | null;
} {
  const text = (description ?? '').trim();
  if (!text) return { body: null, mass: null };
  const at = text.indexOf(MARKER);
  if (at < 0) return { body: text, mass: null };

  const body = text.slice(0, at).trim() || null;
  const tail = text.slice(at + MARKER.length);
  const basisMatch = tail.match(/^\(([^)]*)\)/);
  const basis = basisMatch?.[1] ?? '';
  const afterDash = tail.replace(/^\([^)]*\)\s*[—-]\s*/, '');
  const rows = afterDash
    .split('｜')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf(':');
      if (idx < 0) return { label: '', value: part };
      return { label: part.slice(0, idx).trim(), value: part.slice(idx + 1).trim() };
    })
    .filter((r) => r.value && r.value !== '—');

  return { body, mass: rows.length ? { basis, rows } : null };
}
