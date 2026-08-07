import { describe, expect, it } from 'vitest';
import type { VisitRecord } from './journey';
import { JOURNEY, buildJourneySegments, orderVisitsByDate, segmentOpacity } from './journey';

function visit(siteId: string, visitedAt: string | null): VisitRecord {
  return { siteId, visitedAt };
}

describe('orderVisitsByDate — 시간순 정렬', () => {
  it('오래된 것부터 최근 순으로 세운다', () => {
    const ordered = orderVisitsByDate([
      visit('c', '2026-03-01'),
      visit('a', '2026-01-01'),
      visit('b', '2026-02-01'),
    ]);

    expect(ordered.map((v) => v.siteId)).toEqual(['a', 'b', 'c']);
  });

  it('날짜를 모르는 기록은 가장 앞에 둔다', () => {
    // 뒤에 두면 모르는 기록이 가장 최근인 척하게 되고 선의 끝이 엉뚱해진다
    const ordered = orderVisitsByDate([
      visit('known', '2026-01-01'),
      visit('unknown', null),
    ]);

    expect(ordered.map((v) => v.siteId)).toEqual(['unknown', 'known']);
  });

  it('원본 배열을 건드리지 않는다', () => {
    const input = [visit('b', '2026-02-01'), visit('a', '2026-01-01')];
    orderVisitsByDate(input);

    expect(input.map((v) => v.siteId)).toEqual(['b', 'a']);
  });

  it('같은 날짜끼리는 순서를 뒤집지 않는다', () => {
    const ordered = orderVisitsByDate([
      visit('first', '2026-01-01'),
      visit('second', '2026-01-01'),
    ]);

    expect(ordered.map((v) => v.siteId)).toEqual(['first', 'second']);
  });
});

describe('segmentOpacity — 최근일수록 진하게', () => {
  it('가장 최근 구간이 가장 진하다', () => {
    expect(segmentOpacity(4, 5)).toBe(1);
  });

  it('가장 오래된 구간이 가장 옅다', () => {
    expect(segmentOpacity(0, 5)).toBe(JOURNEY.minOpacity);
  });

  it('오래될수록 옅어진다', () => {
    const values = [0, 1, 2, 3, 4].map((i) => segmentOpacity(i, 5));

    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  it('가장 오래된 것도 완전히 사라지지는 않는다', () => {
    // 0 이 되면 초기 여정이 잘려 보인다
    expect(segmentOpacity(0, 50)).toBeGreaterThan(0);
    expect(segmentOpacity(0, 200)).toBeGreaterThanOrEqual(JOURNEY.minOpacity);
  });

  it('구간이 하나뿐이면 진하게 그린다', () => {
    expect(segmentOpacity(0, 1)).toBe(1);
  });
});

describe('buildJourneySegments — 이을 구간', () => {
  it('n 곳을 다녀왔으면 n-1 개 구간이 나온다', () => {
    const segments = buildJourneySegments([
      visit('a', '2026-01-01'),
      visit('b', '2026-02-01'),
      visit('c', '2026-03-01'),
    ]);

    expect(segments).toHaveLength(2);
    expect(segments.map((s) => [s.fromId, s.toId])).toEqual([
      ['a', 'b'],
      ['b', 'c'],
    ]);
  });

  it('한 곳만 다녀왔으면 이을 것이 없다', () => {
    expect(buildJourneySegments([visit('a', '2026-01-01')])).toEqual([]);
  });

  it('아무 데도 안 갔으면 빈 배열', () => {
    expect(buildJourneySegments([])).toEqual([]);
  });

  it('마지막 구간이 가장 진하다', () => {
    const segments = buildJourneySegments([
      visit('a', '2026-01-01'),
      visit('b', '2026-02-01'),
      visit('c', '2026-03-01'),
    ]);

    expect(segments.at(-1)?.opacity).toBe(1);
    expect(segments[0]!.opacity).toBeLessThan(segments.at(-1)!.opacity);
  });

  it('입력이 뒤섞여 있어도 시간순으로 잇는다', () => {
    const segments = buildJourneySegments([
      visit('c', '2026-03-01'),
      visit('a', '2026-01-01'),
      visit('b', '2026-02-01'),
    ]);

    expect(segments.map((s) => s.fromId)).toEqual(['a', 'b']);
  });

  it('같은 성지를 연달아 표시했으면 그 구간은 건너뛴다', () => {
    const segments = buildJourneySegments([
      visit('a', '2026-01-01'),
      visit('a', '2026-01-02'),
      visit('b', '2026-02-01'),
    ]);

    expect(segments.map((s) => [s.fromId, s.toId])).toEqual([['a', 'b']]);
  });
});
