/**
 * PWA / 앱 아이콘 생성 스크립트.
 *
 * 디자인 확정 전까지 쓰는 임시 아이콘(브랜드 블루 배경 + 흰 십자가)을 만든다.
 * 최종 로고가 나오면 public/icons 의 파일을 교체하고 이 스크립트는 지워도 된다.
 *
 *   node scripts/generate-icons.mjs
 */

import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'icons');

const BRAND_BLUE = [0x1e, 0x3a, 0x8a];
const WHITE = [0xff, 0xff, 0xff];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/** size×size RGB PNG 를 만든다. pixel(x, y) 는 [r,g,b] 를 돌려준다. */
function makePng(size, pixel) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixel(x, y);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** 가운데 십자가. padding 은 마스커블 아이콘용 안전 여백 비율. */
function crossPixel(size, padding) {
  const safe = size * (1 - padding * 2);
  const armThickness = safe * 0.16;
  const cx = size / 2;
  const verticalTop = size / 2 - safe / 2;
  const verticalBottom = size / 2 + safe / 2;
  const crossBarY = verticalTop + safe * 0.3;
  const barHalfWidth = safe * 0.26;

  return (x, y) => {
    const inVertical =
      Math.abs(x - cx) <= armThickness / 2 && y >= verticalTop && y <= verticalBottom;
    const inHorizontal =
      Math.abs(y - crossBarY) <= armThickness / 2 && Math.abs(x - cx) <= barHalfWidth;
    return inVertical || inHorizontal ? WHITE : BRAND_BLUE;
  };
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: 'icon-192.png', size: 192, padding: 0.12 },
  { file: 'icon-512.png', size: 512, padding: 0.12 },
  // 마스커블은 원형으로 잘려도 안전하도록 여백을 더 준다.
  { file: 'icon-512-maskable.png', size: 512, padding: 0.22 },
  { file: 'apple-touch-icon.png', size: 180, padding: 0.12 },
];

for (const { file, size, padding } of targets) {
  writeFileSync(join(OUT_DIR, file), makePng(size, crossPixel(size, padding)));
  console.log(`generated public/icons/${file} (${size}x${size})`);
}
