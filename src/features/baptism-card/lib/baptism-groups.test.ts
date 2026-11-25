import { describe, expect, it } from 'vitest';
import { BAPTISM_NAMES } from '../data/baptism-names';
import {
  featuredSaints,
  filterNames,
  nameSlugOf,
  relatedNames,
  saintsOfName,
  sortedNames,
} from './baptism-groups';
import { RELATED_NAMES } from '../data/baptism-related';

describe('세례명 묶음', () => {
  it('맨 위 성인 다섯 분은 한국어에서 성을 빼고 부른다', () => {
    expect(featuredSaints('ko').map((s) => s.label)).toEqual([
      '대건 안드레아',
      '하상 바오로',
      '경환 프란치스코',
      '대철 베드로',
      '정혜 엘리사벳',
    ]);
    expect(featuredSaints('en')[0]?.label).toBe('Andrew Kim Dae-geon');
  });

  it('세례명 목록에는 성인 카드가 없고 가나다순이다', () => {
    const names = sortedNames('ko');
    expect(names.every((n) => n.kind !== 'saint')).toBe(true);
    expect(names.length).toBe(BAPTISM_NAMES.filter((n) => n.kind !== 'saint').length);
    const labels = names.map((n) => n.label);
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'ko')));
  });

  it('성인은 모두 어느 세례명 카드 하나에 들어간다', () => {
    const nameSlugs = new Set(sortedNames('ko').map((n) => n.slug));
    for (const s of BAPTISM_NAMES.filter((n) => n.kind === 'saint')) {
      expect(nameSlugs.has(nameSlugOf(s))).toBe(true);
    }
  });

  it('베드로 카드에는 유대철 베드로를 포함한 성인들이 모인다', () => {
    const peter = saintsOfName('Peter', 'ko').map((s) => s.label);
    expect(peter).toContain('유대철 베드로');
    expect(peter.every((l) => l.endsWith('베드로'))).toBe(true);
  });

  it('검색은 세례명이나 그 이름의 성인 이름으로 찾는다', () => {
    const names = sortedNames('ko');
    expect(filterNames(names, '베드', 'ko').map((n) => n.label)).toEqual(['베드로']);
    expect(filterNames(names, '대철', 'ko').map((n) => n.label)).toEqual(['베드로']);
    expect(filterNames(names, ' ', 'ko')).toHaveLength(names.length);
  });
});

describe('많이 쓰는 다른 표기 (2026-11-19)', () => {
  it('한국어 버튼은 공식 표기 뒤에 괄호로 붙고, 가나다 자리는 공식 표기 그대로다', () => {
    const labels = sortedNames('ko').map((n) => n.label);
    expect(labels).toContain('체칠리아(세실리아)');
    expect(labels).toContain('데레사(테레사)');
    expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b, 'ko')));
  });

  it('익숙한 표기로 검색해도 찾는다', () => {
    const found = filterNames(sortedNames('ko'), '세실리아', 'ko').map((n) => n.slug);
    expect(found).toEqual(['Cecilia']);
  });

  it('외국어 화면과 성인 이름에는 붙이지 않는다', () => {
    expect(sortedNames('en').some((n) => n.label.includes('('))).toBe(false);
    expect(saintsOfName('Teresa', 'ko').some((s) => s.label.includes('('))).toBe(false);
  });
});

describe('사장님 추가 표기 (2026-11-19)', () => {
  it('줄리아·빈센트로도 찾는다', () => {
    const names = sortedNames('ko');
    expect(filterNames(names, '줄리아', 'ko').map((n) => n.label)).toEqual(['율리아(줄리아)']);
    expect(filterNames(names, '빈센트', 'ko').map((n) => n.label)).toEqual(['빈첸시오(빈센트)']);
  });
});

describe('세례명 2판 (지시서 9호)', () => {
  it('마틸다·사비나를 검색하면 나온다', () => {
    const names = sortedNames('ko');
    expect(filterNames(names, '마틸다', 'ko').map((n) => n.slug)).toEqual(['Matilda']);
    expect(filterNames(names, '사비나', 'ko').map((n) => n.slug)).toEqual(['Sabina']);
  });

  it('함께 묶인 세례명은 양쪽으로 이어진다 — 안나 ↔ 요아킴', () => {
    expect(relatedNames('Anne', 'ko').map((n) => n.label)).toContain('요아킴');
    expect(relatedNames('Joachim', 'ko').map((n) => n.label)).toContain('안나');
  });

  it('성인 카드를 골라도 그 세례명의 묶음이 보인다', () => {
    const saint = BAPTISM_NAMES.find((n) => n.kind === 'saint' && nameSlugOf(n) === 'Anne');
    expect(saint).toBeDefined();
    expect(relatedNames(saint!.slug, 'ko').map((n) => n.slug)).toContain('Joachim');
  });

  it('묶음에 적힌 이름은 모두 목록에 있다', () => {
    const slugs = new Set(BAPTISM_NAMES.map((n) => n.slug));
    for (const [k, v] of Object.entries(RELATED_NAMES)) {
      expect(slugs.has(k)).toBe(true);
      for (const s of v) expect(slugs.has(s)).toBe(true);
    }
  });
});
