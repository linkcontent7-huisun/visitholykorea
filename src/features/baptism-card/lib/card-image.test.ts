import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BAPTISM_NAMES } from '../data/baptism-names';
import { cardImageUrl, cardLanguage } from './card-image';

describe('카드 그림 주소', () => {
  it('2판에 더한 이름은 다른 언어 화면에서 영어 카드를 쓴다', () => {
    expect(cardLanguage('es', 'Matilda')).toBe('en');
    expect(cardLanguage('ko', 'Matilda')).toBe('ko');
    expect(cardLanguage('es', 'Anne')).toBe('es');
    expect(cardImageUrl('it', 'Sabina')).toBe('/baptism-cards/en/Sabina.webp');
  });

  it('모든 세례명 카드가 여섯 언어 화면에서 실제 그림 파일을 가리킨다', () => {
    for (const n of BAPTISM_NAMES) {
      for (const lang of ['ko', 'en', 'es', 'fr', 'pt', 'it'] as const) {
        expect(existsSync(`public${cardImageUrl(lang, n.slug)}`), `${lang}/${n.slug}`).toBe(true);
      }
    }
  });
});
