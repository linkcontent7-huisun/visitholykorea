import { describe, expect, it } from 'vitest';
import { applyTranslation, resolveTranslation, type SiteTranslation } from './translated-site';

const site = { name: '절두산 순교성지', description: '소개문', history: '역사문' };

const en: SiteTranslation = {
  name: 'Jeoldusan Martyrs’ Shrine',
  description: 'English description',
  history: 'English history',
  addressRomanized: 'Tojeong-ro 6, Mapo-gu',
};

describe('applyTranslation', () => {
  it('번역이 없으면 원문을 그대로 쓴다', () => {
    const view = applyTranslation(site, null);
    expect(view.name).toBe('절두산 순교성지');
    expect(view.addressRomanized).toBeNull();
  });

  it('번역의 빈 칸은 원문으로 메운다 — 빈 화면보다 한국어가 낫다', () => {
    const view = applyTranslation(site, { ...en, history: null });
    expect(view.name).toBe('Jeoldusan Martyrs’ Shrine');
    expect(view.history).toBe('역사문');
  });
});

describe('resolveTranslation — 폴백 사슬', () => {
  it('요청한 언어가 다 있으면 그대로 쓴다', () => {
    const es: SiteTranslation = {
      name: 'Santuario de los Mártires',
      description: 'Descripción',
      history: 'Historia',
      addressRomanized: 'Tojeong-ro 6',
    };
    const result = resolveTranslation({ es, en }, 'es');
    expect(result?.name).toBe('Santuario de los Mártires');
    expect(result?.history).toBe('Historia');
  });

  it('스페인어가 없으면 영어로 내려간다 — 한국어를 보여주면 못 읽는다', () => {
    const result = resolveTranslation({ en }, 'es');
    expect(result?.name).toBe('Jeoldusan Martyrs’ Shrine');
  });

  it('칸 단위로 섞는다 — 스페인어 이름 + 영어 역사', () => {
    const partialEs: SiteTranslation = {
      name: 'Santuario de los Mártires',
      description: null,
      history: null,
      addressRomanized: null,
    };
    const result = resolveTranslation({ es: partialEs, en }, 'es');
    expect(result?.name).toBe('Santuario de los Mártires');
    expect(result?.history).toBe('English history');
  });

  it('한국어 모드는 번역을 쓰지 않는다', () => {
    expect(resolveTranslation({ en }, 'ko')).toBeNull();
  });

  it('아무 번역도 없으면 null — 호출부가 원문으로 폴백한다', () => {
    expect(resolveTranslation({}, 'fr')).toBeNull();
  });
});
