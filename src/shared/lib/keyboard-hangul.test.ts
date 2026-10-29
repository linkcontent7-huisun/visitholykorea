import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  fixKoreanTypedInEnglish,
  keyboardToHangul,
  likelyKoreanTypedInEnglish,
  looksLikeForeignSentence,
} from './keyboard-hangul';

describe('영문 자판으로 친 한글 되돌리기 (2026-10-14)', () => {
  it('성지·성당 이름을 되돌린다', () => {
    expect(keyboardToHangul('audehdtjdekd')).toBe('명동성당');
    expect(keyboardToHangul('goaltnsrytjdwl')).toBe('해미순교성지');
    expect(keyboardToHangul('wjfentks')).toBe('절두산');
    expect(keyboardToHangul('thfahl')).toBe('솔뫼');
    expect(keyboardToHangul('rhdtpfl')).toBe('공세리');
  });

  it('쌍자음(Shift)과 겹받침·겹모음을 조립한다', () => {
    expect(keyboardToHangul('Tkdrhl')).toBe('쌍괴');
    expect(keyboardToHangul('dlfrrl')).toBe('읽기');
    expect(keyboardToHangul('dnlrhk')).toBe('위과');
  });

  it('진짜 영어 단어는 건드리지 않는다', () => {
    expect(likelyKoreanTypedInEnglish('shrine')).toBeNull();
    expect(likelyKoreanTypedInEnglish('Haemi')).toBeNull();
    expect(likelyKoreanTypedInEnglish('cathedral')).toBeNull();
  });

  it('문장 안에서 해당 단어만 바꾼다', () => {
    expect(fixKoreanTypedInEnglish('audehdtjdekd 어디야')).toBe('명동성당 어디야');
    expect(fixKoreanTypedInEnglish('Where is Haemi Shrine')).toBe('Where is Haemi Shrine');
  });

  it('진짜 외국어 문장은 한글로 되돌리지 않는다 (Which → 퍄냣 오작동, 2026-10-29)', () => {
    for (const q of [
      'Which shrine should I visit in Jeju?',
      '¿Qué santuario puedo visitar en Seúl?',
      'Où se trouve le sanctuaire de Jeoldusan ?',
      'Dove si trova il santuario di Haemi?',
      'Onde fica o santuário de Myeongdong?',
    ]) {
      expect(looksLikeForeignSentence(q)).toBe(true);
      expect(fixKoreanTypedInEnglish(q)).toBe(q);
    }
  });

  it('영문 자판으로 친 한글은 외국어 문장으로 보지 않는다', () => {
    for (const q of ['audehdtjdekd', 'wjfentn tjdwl', 'anjwj tjdwl']) {
      expect(looksLikeForeignSentence(q)).toBe(false);
    }
    expect(fixKoreanTypedInEnglish('audehdtjdekd')).toBe('명동성당');
  });

  it('Edge Function 복사본과 내용이 같다', () => {
    const a = readFileSync(resolve(__dirname, 'keyboard-hangul.ts'), 'utf8');
    const b = readFileSync(
      resolve(__dirname, '../../../supabase/functions/_shared/keyboard-hangul.ts'),
      'utf8',
    );
    expect(b).toBe(a);
  });
});
