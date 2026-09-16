import { describe, expect, it } from 'vitest';
import { DIOCESE_IMAGES, dioceseImageFor, placeholderImageFor } from './site-placeholder';

describe('교구 대표 사진', () => {
  it('표에 있는 교구는 사진·출처·라이선스가 다 있다', () => {
    for (const [dio, img] of Object.entries(DIOCESE_IMAGES)) {
      expect(dioceseImageFor(dio)).toBe(img);
      expect(img.url).toMatch(/^(https:\/\/upload\.wikimedia\.org\/|\/images\/sites\/)/);
      expect(img.label).not.toBe('');
      expect(img.source).not.toBe('');
      expect(img.license).not.toBe('');
    }
  });

  it('표에 없는 교구·빈 값은 null — 호출부가 기존 임시 이미지로 넘어간다', () => {
    expect(dioceseImageFor('경기')).toBeNull();
    expect(dioceseImageFor(null)).toBeNull();
    expect(dioceseImageFor('')).toBeNull();
    expect(placeholderImageFor('던지실 성지')).toMatch(/^\/placeholders\/site-placeholder-[1-6]\.webp$/);
  });
});
