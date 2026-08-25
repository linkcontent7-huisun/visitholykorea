import { describe, expect, it } from 'vitest';
import { applyTranslation } from './translated-site';

const site = { name: '갈매못 순교성지', description: '한국어 소개', history: '한국어 역사' };

describe('applyTranslation', () => {
  it('번역이 없으면 원문 그대로', () => {
    const v = applyTranslation(site, null);
    expect(v.name).toBe('갈매못 순교성지');
    expect(v.description).toBe('한국어 소개');
    expect(v.addressRomanized).toBeNull();
  });

  it('채워진 칸만 겹친다 — 빈 문자열은 번역으로 치지 않는다', () => {
    const v = applyTranslation(site, {
      name: 'Galmaemot Martyrdom Shrine',
      description: '  ',
      history: null,
      addressRomanized: '610 Ocheonhaean-ro',
    });
    expect(v.name).toBe('Galmaemot Martyrdom Shrine');
    expect(v.description).toBe('한국어 소개'); // 공백뿐이면 원문 유지
    expect(v.history).toBe('한국어 역사');
    expect(v.addressRomanized).toBe('610 Ocheonhaean-ro');
  });
});
