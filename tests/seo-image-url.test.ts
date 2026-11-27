import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderPage, siteMeta, type SeoSite } from '../scripts/lib/seo-pages';

const template = readFileSync('index.html', 'utf-8');
const site: SeoSite = {
  id: 'x',
  name: '갈곡리 성당',
  seoTitle: null,
  seoDescription: null,
  description: null,
  location: '경기도 포천시',
  regionProvince: '경기',
  lat: null,
  lng: null,
  imageUrl: null,
};

describe('공유 그림 주소 (점검 B, 2026-11-22)', () => {
  it('도메인 없이 적힌 자체 사진에 우리 도메인을 붙인다', () => {
    const meta = siteMeta({ ...site, imageUrl: '/images/sites/galgokri-seongdang.jpg' });
    expect(meta.image).toBe('https://visitholykorea.com/images/sites/galgokri-seongdang.jpg');
    expect(renderPage(template, meta)).toContain(
      'og:image" content="https://visitholykorea.com/images/sites/galgokri-seongdang.jpg"',
    );
  });
  it('이미 전체 주소면 그대로 둔다', () => {
    expect(siteMeta({ ...site, imageUrl: 'https://upload.wikimedia.org/a.jpg' }).image).toBe(
      'https://upload.wikimedia.org/a.jpg',
    );
  });
});
