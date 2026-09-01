/**
 * 순례자 사진 업로드 전 축소.
 *
 * 휴대폰 원본은 3~10MB 다. 그대로 올리면 저장소 비용과 "링크가 멈춘다"
 * 문제(2026-08-28 사고)가 그대로 재현된다. 사이트 사진 규칙과 같은
 * 기준을 쓴다 — 최장변 1600px, JPEG 82%, 약 700KB 이하.
 */

/** 최장변이 max 를 넘지 않게 줄인 크기. 작으면 그대로 둔다(확대 금지). */
export function fitWithin(
  width: number,
  height: number,
  max: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= max) return { width, height };
  const k = max / longest;
  return { width: Math.round(width * k), height: Math.round(height * k) };
}

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/** 파일을 캔버스로 줄여 JPEG Blob 으로 만든다. 실패하면 원본을 그대로 쓴다. */
export async function shrinkPhoto(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, MAX_EDGE);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
    );
    return blob ?? file;
  } catch {
    // HEIC 미지원 브라우저 등 — 원본이라도 올라가는 편이 낫다
    return file;
  }
}
