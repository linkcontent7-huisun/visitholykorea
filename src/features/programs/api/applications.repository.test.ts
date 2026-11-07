import { describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/api/supabase', () => ({ supabase: {} }));

import {
  applicationsToCsv,
  receiptCode,
  summarize,
  type ProgramApplication,
} from './applications.repository';

const row = (over: Partial<ProgramApplication>): ProgramApplication => ({
  id: 'abcd1234-0000-0000-0000-000000000000',
  createdAt: '2026-11-03T00:00:00Z',
  programSlug: 'bread-from-heaven',
  course: 'A',
  visitDate: '2026-11-20',
  contactName: '홍길동',
  contactPhone: '010-0000-0000',
  adults: 0,
  children: 0,
  seniors: 0,
  needsMobilityHelp: false,
  requestNote: '',
  noticeConsent: false,
  ...over,
});

describe('summarize', () => {
  it('인원·연령대·코스·날짜별로 더한다', () => {
    const s = summarize([
      row({ adults: 2, children: 1 }),
      row({ course: 'B', seniors: 2, needsMobilityHelp: true, visitDate: '2026-11-19' }),
    ]);
    expect(s).toMatchObject({
      count: 2,
      people: 5,
      adults: 2,
      children: 1,
      seniors: 2,
      mobility: 1,
    });
    expect(s.byCourse).toEqual({ A: 3, B: 2 });
    expect(s.byDate).toEqual([
      { date: '2026-11-19', people: 2 },
      { date: '2026-11-20', people: 3 },
    ]);
  });

  it('접수가 없으면 0', () => {
    expect(summarize([]).people).toBe(0);
  });
});

describe('receiptCode', () => {
  it('앞 8자리를 대문자로', () => {
    expect(receiptCode('abcd1234-ffff')).toBe('ABCD1234');
  });
});

describe('applicationsToCsv', () => {
  it('엑셀용 BOM·머리줄을 넣고, 연락처 하이픈·쉼표 따옴표·안내 동의를 표시한다', () => {
    const csv = applicationsToCsv([
      row({ adults: 2, contactPhone: '01012345678', requestNote: '휠체어, 1대', noticeConsent: true }),
    ]);
    expect(csv.startsWith('﻿접수번호,')).toBe(true);
    const line = csv.split('\r\n')[1]!;
    expect(line).toContain('010-1234-5678');
    expect(line).toContain('"휠체어, 1대"');
    expect(line.endsWith(',동의')).toBe(true);
  });
});
