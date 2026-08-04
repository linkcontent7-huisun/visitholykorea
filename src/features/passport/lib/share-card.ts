/**
 * 순례 스탬프 SNS 공유 카드(인스타그램 스토리 규격 9:16)를 클라이언트에서 직접 합성한다.
 * 서버 비용 없이 Canvas API만으로 만들기 때문에 저비용 바이럴 채널로 쓸 수 있다.
 */

import type { LiturgicalEvent } from './liturgical-calendar';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

interface ShareCardOptions {
  siteName: string;
  location: string;
  emotionTag: string | null;
  imageUrl: string | null;
  visitedAt: Date;
  liturgical: LiturgicalEvent;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCoverImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const scale = Math.max(CARD_WIDTH / img.width, CARD_HEIGHT / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (CARD_WIDTH - w) / 2;
  const y = (CARD_HEIGHT - h) / 2;
  ctx.drawImage(img, x, y, w, h);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 카드를 그려서 PNG Blob으로 반환한다. */
export async function generateShareCard(options: ShareCardOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context를 만들 수 없습니다.');

  // 배경: 성지 사진이 있으면 그걸, 없으면 전례 시기 색 그라디언트
  if (options.imageUrl) {
    try {
      const img = await loadImage(options.imageUrl);
      drawCoverImage(ctx, img);
    } catch {
      ctx.fillStyle = '#312e81';
      ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
    }
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    grad.addColorStop(0, '#4338ca');
    grad.addColorStop(1, '#7c3aed');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  // 하단 어두운 그라디언트 (텍스트 가독성)
  const overlay = ctx.createLinearGradient(0, CARD_HEIGHT * 0.35, 0, CARD_HEIGHT);
  overlay.addColorStop(0, 'rgba(0,0,0,0)');
  overlay.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = overlay;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // 상단 로고
  ctx.font = '700 40px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  ctx.fillText('VISIT ', 64, 64);
  const visitWidth = ctx.measureText('VISIT ').width;
  ctx.fillStyle = '#c4b5fd';
  ctx.fillText('HOLY', 64 + visitWidth, 64);

  // 전례 시기 배지
  const badgeLabel = `${options.liturgical.emoji} ${options.liturgical.label}`;
  ctx.font = '700 32px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  const badgeTextWidth = ctx.measureText(badgeLabel).width;
  const badgeW = badgeTextWidth + 56;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  roundRect(ctx, 64, CARD_HEIGHT - 560, badgeW, 72, 36);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeLabel, 64 + 28, CARD_HEIGHT - 560 + 36);

  // 감정 태그
  if (options.emotionTag) {
    ctx.font = '600 30px "Pretendard", "Apple SD Gothic Neo", sans-serif';
    ctx.fillStyle = '#e5e7eb';
    ctx.textBaseline = 'top';
    ctx.fillText(`#${options.emotionTag}`, 64, CARD_HEIGHT - 460);
  }

  // 성지 이름 (긴 이름은 줄바꿈)
  ctx.font = '800 76px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'top';
  wrapText(ctx, options.siteName, 64, CARD_HEIGHT - 400, CARD_WIDTH - 128, 88);

  // 위치
  ctx.font = '500 34px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#d1d5db';
  ctx.fillText(options.location, 64, CARD_HEIGHT - 220);

  // 방문 날짜
  const dateStr = options.visitedAt.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  ctx.font = '600 32px "Pretendard", "Apple SD Gothic Neo", sans-serif';
  ctx.fillStyle = '#a5b4fc';
  ctx.fillText(`${dateStr}에 다녀왔어요`, 64, CARD_HEIGHT - 160);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('이미지 생성에 실패했습니다.'));
    }, 'image/png');
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(' ');
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

/** 생성된 카드를 다운로드하거나(데스크톱), 지원되면 공유 시트를 띄운다(모바일). */
export async function shareOrDownloadCard(blob: Blob, fileName: string) {
  const file = new File([blob], fileName, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'VisitHolyKorea 순례 스탬프' });
      return;
    } catch {
      // 사용자가 공유를 취소한 경우 등 — 다운로드로 대체
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
