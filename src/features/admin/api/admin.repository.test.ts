import { describe, expect, it } from 'vitest';
import { byMostMissing, toSiteSummary } from './admin.repository';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'site-1',
    name: '절두산 순교성지',
    diocese: '서울',
    image_url: 'https://example.com/a.jpg',
    description: '한강이 내려다보이는 순교지',
    history: '1866년 병인박해',
    ...overrides,
  };
}

describe('toSiteSummary — 무엇이 비었는가', () => {
  it('다 채워진 성지는 빈 항목이 0개다', () => {
    expect(toSiteSummary(row()).missingCount).toBe(0);
  });

  it('사진·소개글·역사가 없으면 3개로 센다', () => {
    const summary = toSiteSummary(row({ image_url: null, description: null, history: null }));
    expect(summary).toMatchObject({
      hasPhoto: false,
      hasDescription: false,
      hasHistory: false,
      missingCount: 3,
    });
  });

  it('공백만 있는 소개글은 없는 것으로 친다', () => {
    expect(toSiteSummary(row({ description: '   ' })).hasDescription).toBe(false);
  });

  it('교구가 비어 있어도 빈 문자열로 들어온다 (화면이 null 을 만나지 않게)', () => {
    expect(toSiteSummary(row({ diocese: null })).diocese).toBe('');
  });
});

describe('byMostMissing — 대기열 정렬', () => {
  it('많이 빈 곳이 위로 온다', () => {
    const full = toSiteSummary(row({ id: 'a', name: '가나 성지' }));
    const empty = toSiteSummary(row({ id: 'b', name: '하나 성지', image_url: null }));
    expect([full, empty].sort(byMostMissing)[0]?.id).toBe('b');
  });

  it('빈 개수가 같으면 이름 가나다순으로 고정된다', () => {
    const first = toSiteSummary(row({ id: 'a', name: '나주 성지' }));
    const second = toSiteSummary(row({ id: 'b', name: '가평 성지' }));
    expect([first, second].sort(byMostMissing).map((s) => s.id)).toEqual(['b', 'a']);
  });
});
