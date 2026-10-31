/**
 * 성지 홈페이지 글에서 미사 시간 줄을 골라내는 순수 함수들 — `mass-times-collect.ts` 가 쓴다.
 * 네트워크를 만지지 않아 테스트로 확인할 수 있다.
 */

/** 태그를 걷어 줄 단위 글로. 표 칸·줄바꿈 태그는 줄바꿈으로 바꿔 「평일 | 07:00」 이 한 줄에 남게 한다 */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|tr|h\d)>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

/** 「미사」가 링크 글자나 주소에 들어간 링크 — 미사안내·미사시간·mass·missa */
export function findMassLinks(html: string, base: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = m[1] ?? '';
    const label = (m[2] ?? '').replace(/<[^>]+>/g, '');
    if (!/미사|mass|missa/i.test(label + ' ' + href)) continue;
    if (/^(javascript|mailto|tel):/i.test(href)) continue;
    try {
      out.add(new URL(href, base).toString());
    } catch {
      // 깨진 주소는 버린다
    }
  }
  return [...out];
}

const TIME = /(\d{1,2}\s*[:시]\s*\d{0,2}|오전|오후|새벽)/;
const DAY =
  /평일|주일|토요일|일요일|월요일|화요일|수요일|목요일|금요일|매일|특전|첫\s*토|첫토|월\s*~|화\s*~/;

/**
 * 미사 시간으로 보이는 줄만 고른다 — 「미사」나 요일 말이 있고 시각이 있는 줄.
 * 「미사」라는 제목 줄 바로 아래 몇 줄(요일+시각)도 함께 잡는다. 너무 길면 공지문이라 버린다.
 */
export function extractMassLines(text: string, max = 12): string[] {
  const lines = text.split('\n');
  const picked: string[] = [];
  let near = 0; // 「미사」 제목 뒤 몇 줄까지 따라 읽는가
  for (const raw of lines) {
    const line = raw.trim();
    if (line.length > 120) {
      near = 0;
      continue;
    }
    const hasMass = /미사/.test(line);
    const hasTime = TIME.test(line);
    const hasDay = DAY.test(line);
    if (hasMass && !hasTime) near = 6;
    if (hasTime && (hasMass || ((hasDay || near > 0) && /\d/.test(line)))) {
      if (!picked.includes(line)) picked.push(line);
    }
    if (near > 0) near--;
    if (picked.length >= max) break;
  }
  return picked;
}
