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
