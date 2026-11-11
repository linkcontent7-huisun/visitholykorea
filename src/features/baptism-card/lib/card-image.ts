import type { Language } from '@/shared/i18n/dictionary';

/** public/baptism-cards/{언어}/{영어 세례명}.webp — 만드는 곳: design/세례명-공유카드/export_to_app.py */
export function cardImageUrl(language: Language, slug: string): string {
  return `/baptism-cards/${language}/${slug}.webp`;
}

/**
 * 카드를 PNG 파일로 바꾼다. webp 는 인스타·카톡 등 일부 앱이 못 받아서, 저장·공유할 때만 바꾼다.
 * 같은 출처의 그림이라 canvas 가 오염되지 않는다.
 */
export async function cardPngFile(language: Language, slug: string): Promise<File> {
  const res = await fetch(cardImageUrl(language, slug));
  if (!res.ok) throw new Error(`card ${res.status}`);
  const bitmap = await createImageBitmap(await res.blob());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
  bitmap.close();
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!png) throw new Error('png');
  return new File([png], `visitholykorea-${slug}.png`, { type: 'image/png' });
}

/**
 * 공유 창에 넘길 내용을 고른다 — 카드 그림에 안내 글과 사이트 주소를 함께 보낸다.
 *
 * 그림만 보내면 받은 사람이 우리 사이트로 올 길이 없다(사장님 지적 2026-11-11). 주소를 같이 넘기면
 * 받는 앱이 카드 아래에 링크를 붙여 준다. 그림+글 조합을 못 받는 기기는 예전처럼 그림만 보내고,
 * 파일 공유 자체가 안 되면 null 을 돌려줘 호출한 쪽이 저장으로 넘어가게 한다.
 */
export function cardShareData(file: File, text: string, url: string): ShareData | null {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return null;
  const withLink: ShareData = { files: [file], text, url };
  if (navigator.canShare(withLink)) return withLink;
  const imageOnly: ShareData = { files: [file] };
  return navigator.canShare(imageOnly) ? imageOnly : null;
}
