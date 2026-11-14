/**
 * `/api/og` — 메신저·SNS 공유 미리보기 그림(1200×630)을 그때그때 그린다. (v7.0, 2026-11-13)
 *
 * 왜: 성지 페이지 40곳 표본 중 27곳이 사진이 없어 카톡에 링크를 붙이면 로고만 떴다(2026-11-12 실측).
 * 사진이 없는 성지와 첫 화면은 이 그림을 쓴다. 사진이 있는 성지는 그대로 사진을 쓴다(seo-pages.ts).
 *
 *   /api/og?title=절두산 순교성지&sub=서울특별시
 *
 * 글자는 우리가 정한 주소(seo-prerender)에서만 넣지만, 누구나 주소를 만들 수 있으므로 길이를 자른다.
 * 한글 글꼴은 Google Fonts 에서 **그림에 들어가는 글자만** 받아 온다(원본 글꼴은 수 MB 라 함수에 못 넣는다).
 * 같은 주소는 CDN 이 하루 동안 다시 쓴다 — 성지 이름이 바뀌어도 하루 안에 반영된다.
 */
import { ImageResponse } from '@vercel/og';
import type { ReactElement } from 'react';

// Edge 런타임은 Vite 프로젝트에서 그림 엔진(WebAssembly)을 못 띄운다(2026-11-13 미리보기 실측:
// "Wasm code generation disallowed by embedder", 0바이트 응답). 그래서 Node 런타임 + 웹 표준 GET 으로 둔다.

const BG = '#1b1814';
const GOLD = '#d4a017';
const CREAM = '#f4ecd8';

function clip(s: string | null, max: number): string {
  const one = (s ?? '').replace(/\s+/g, ' ').trim();
  return one.length > max ? `${one.slice(0, max - 1)}…` : one;
}

/** 필요한 글자만 담긴 글꼴 파일을 받는다. 실패하면 null — 그림은 기본 글꼴로라도 나간다. */
async function loadFont(text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700&text=${encodeURIComponent(text)}`,
      )
    ).text();
    const src = /src: url\((.+?)\) format\('(opentype|truetype)'\)/.exec(css)?.[1];
    if (!src) return null;
    const res = await fetch(src);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

// satori(그림 엔진)는 React 요소 모양의 객체를 받는다. 이 파일은 .ts 라 JSX 대신 객체로 쓴다.
type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
});

export async function GET(req: Request): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const title = clip(q.get('title'), 28) || '비지트홀리코리아';
  const sub = clip(q.get('sub'), 40) || '길 위에서 나를 만나는 성지순례';
  const brand = 'Visit Holy Korea · visitholykorea.com';

  const font = await loadFont(`${title}${sub}${brand}✝·…`);
  const titleSize = title.length > 14 ? 76 : 96;

  const tree = el(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '72px 88px',
      background: `linear-gradient(160deg, ${BG} 0%, #2c241b 100%)`,
      color: CREAM,
      fontFamily: font ? 'NotoSerifKR' : 'serif',
    },
    [
      // 위: 금색 십자가 (선 두 개 — 글꼴에 기대지 않는다)
      el('div', { display: 'flex', position: 'relative', width: 56, height: 80 }, [
        el('div', {
          position: 'absolute',
          left: 22,
          top: 0,
          width: 12,
          height: 80,
          background: GOLD,
        }),
        el('div', {
          position: 'absolute',
          left: 0,
          top: 20,
          width: 56,
          height: 12,
          background: GOLD,
        }),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { fontSize: titleSize, fontWeight: 700, lineHeight: 1.15 }, title),
        el('div', { marginTop: 24, fontSize: 40, color: GOLD }, sub),
      ]),
      el(
        'div',
        {
          display: 'flex',
          fontSize: 28,
          opacity: 0.7,
          borderTop: `2px solid ${GOLD}`,
          paddingTop: 24,
        },
        brand,
      ),
    ],
  );

  return new ImageResponse(tree as unknown as ReactElement, {
    width: 1200,
    height: 630,
    fonts: font ? [{ name: 'NotoSerifKR', data: font, weight: 700, style: 'normal' }] : [],
    headers: { 'cache-control': 'public, max-age=86400, s-maxage=86400' },
  });
}
