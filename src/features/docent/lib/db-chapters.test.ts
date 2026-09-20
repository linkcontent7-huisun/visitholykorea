import { describe, expect, it } from 'vitest';
import { groupRows, splitIntroParagraphs } from '../api/docent.repository';
import type { DocentScriptRow } from '@/shared/types/database';
import { buildDbChapters, pickIntro, pickTourLanguage } from './db-chapters';

const row = (p: Partial<DocentScriptRow>): DocentScriptRow => ({
  id: 'x',
  site_id: 's1',
  language: 'ko',
  kind: 'point',
  seq: 1,
  title: 't',
  body: 'b',
  look_for: null,
  sources: [],
  status: 'draft',
  written_by: null,
  created_at: '',
  updated_at: '',
  ...p,
});

const rows: DocentScriptRow[] = [
  row({ kind: 'intro', seq: 1, body: '"첫 문단 1801년."\n\n"둘째."\n\n"셋째."' }),
  row({ kind: 'intro', seq: 1, language: 'en', body: '"First 1801."\n\n"Second."\n\n"Third."' }),
  row({ seq: 0, title: '여는 말', body: '환영합니다.' }),
  row({ seq: 1, title: '1. 제대', body: '제대를 보세요.', look_for: '감실' }),
  row({ seq: 99, title: '맺음말', body: '안녕히.' }),
  // 영어 투어는 맺음말이 빠져 불완전하다
  row({ language: 'en', seq: 0, title: 'Welcome', body: 'Welcome.' }),
  row({ language: 'en', seq: 1, title: '1. Altar', body: 'Look at the altar.' }),
];

describe('DB 도슨트 원고', () => {
  it('소개글은 큰따옴표를 벗긴 세 문단으로 나뉜다', () => {
    expect(splitIntroParagraphs('"가."\n\n"나."\n\n"다."')).toEqual(['가.', '나.', '다.']);
  });

  it('요청 언어에 완전한 투어가 없으면 영어 → 한국어 순으로 내려간다', () => {
    const scripts = groupRows(rows);
    expect(pickTourLanguage(scripts, 'ko')).toBe('ko');
    // 영어는 맺음말이 없어 불완전 → 한국어
    expect(pickTourLanguage(scripts, 'en')).toBe('ko');
    expect(pickTourLanguage(scripts, 'fr')).toBe('ko');
    expect(pickTourLanguage(undefined, 'ko')).toBeNull();
  });

  it('챕터는 여는 말·지점·맺음말 순이고 lookFor 를 잇는다', () => {
    const chapters = buildDbChapters(groupRows(rows), 'ko')!;
    expect(chapters.map((c) => c.id)).toEqual(['intro', 'point-1', 'outro']);
    expect(chapters[1]!.lookFor).toBe('감실');
  });

  it('소개글은 요청 언어가 없으면 영어, 영어도 없으면 한국어', () => {
    const scripts = groupRows(rows);
    expect(pickIntro(scripts, 'en')?.paragraphs[0]).toBe('First 1801.');
    expect(pickIntro(scripts, 'es')?.language).toBe('en');
    expect(pickIntro(groupRows(rows.filter((r) => r.language === 'ko')), 'es')?.language).toBe(
      'ko',
    );
  });
});
