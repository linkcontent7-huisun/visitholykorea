import type { Language } from '@/shared/i18n/dictionary';
import { EN_CARD_ONLY } from '../data/baptism-card-langs';

/**
 * 그 언어의 카드 그림이 있는 언어. 2판(2026-11-25)에 더한 이름은 한국어·영어 그림만 있어
 * 다른 언어 화면에서는 영어 카드를 보인다(번역 규칙: 없는 언어는 영어로 대신).
 */
export function cardLanguage(language: string, slug: string): string {
  return language !== 'ko' && language !== 'en' && EN_CARD_ONLY.has(slug) ? 'en' : language;
}

/** public/baptism-cards/{언어}/{영어 세례명}.webp — 만드는 곳: design/세례명-공유카드/gen_cards_v2_all.py */
export function cardImageUrl(language: Language, slug: string): string {
  return `/baptism-cards/${cardLanguage(language, slug)}/${slug}.webp`;
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
