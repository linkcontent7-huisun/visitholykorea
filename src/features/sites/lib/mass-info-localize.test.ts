import { describe, expect, it } from 'vitest';
import { localizeMassLabel, localizeMassValue } from './mass-info-localize';

describe('localizeMassLabel', () => {
  it('한국어면 그대로 둔다', () => {
    expect(localizeMassLabel('주일', 'ko')).toBe('주일');
  });

  it('주일·평일·비고를 화면 언어로 바꾼다', () => {
    expect(localizeMassLabel('주일', 'en')).toBe('Sunday');
    expect(localizeMassLabel('평일', 'fr')).toBe('En semaine');
    expect(localizeMassLabel('비고', 'it')).toBe('Note');
  });

  it('모르는 라벨은 원문을 돌려준다', () => {
    expect(localizeMassLabel('기타', 'en')).toBe('기타');
  });
});

describe('localizeMassValue', () => {
  it('한국어면 손대지 않는다', () => {
    const v = '월 07:00 · 화~토 07:00, 10:00(성지미사)';
    expect(localizeMassValue(v, 'ko')).toBe(v);
  });

  it('요일 한 글자를 바꾸되 물결·가운뎃점·시각은 그대로 둔다 (명동대성당 평일)', () => {
    const v =
      '월 07:00, 10:00(성지미사), 18:00 · 화~토 07:00, 10:00(성지미사), 18:00, 19:00 (토 18:00·19:00 주일미사)';
    expect(localizeMassValue(v, 'en')).toBe(
      'Mon 07:00, 10:00(shrine Mass), 18:00 · Tue~Sat 07:00, 10:00(shrine Mass), 18:00, 19:00 (Sat 18:00·19:00 Sunday Mass)',
    );
  });

  it('「매월」「월례」「21일」 안의 글자는 요일로 보지 않는다 (삼성산 성지)', () => {
    expect(localizeMassValue('월례미사 매월 21일 11:00', 'es')).toBe(
      'misa mensual el día 21 11:00',
    );
  });

  it('「월요일 휴관」은 요일 치환보다 먼저 구절로 바꾼다 (명동 비고)', () => {
    expect(localizeMassValue('서울대교구 역사관 09:00~17:00(월요일 휴관) 02-6949-1890', 'fr')).toBe(
      'Musée d’histoire de l’archidiocèse de Séoul 09:00~17:00(fermé le lundi) 02-6949-1890',
    );
  });

  it('사전에 없는 고유명사는 한국어로 남긴다', () => {
    expect(localizeMassValue('성모동산 개방', 'pt')).toBe('성모동산 개방');
  });
});
