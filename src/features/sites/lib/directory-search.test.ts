import { describe, expect, it } from 'vitest';
import { directoryCoreTerm, directoryMatchRank, rankDirectoryResults } from './directory-search';

describe('directoryCoreTerm', () => {
  it('꼬리말 성당·대성당·본당·공소를 뗀다', () => {
    expect(directoryCoreTerm('서귀포성당')).toBe('서귀포');
    expect(directoryCoreTerm('명동대성당')).toBe('명동');
    expect(directoryCoreTerm('답동 주교좌성당')).toBe('답동');
    expect(directoryCoreTerm('신제주 본당')).toBe('신제주');
    expect(directoryCoreTerm('강정공소')).toBe('강정');
  });
  it('떼고 나면 비는 말은 그대로', () => {
    expect(directoryCoreTerm('성당')).toBe('성당');
    expect(directoryCoreTerm('  서귀포 ')).toBe('서귀포');
  });
});

describe('directoryMatchRank', () => {
  it('(지)·주교좌 꼬리표를 빼고 비교한다', () => {
    expect(directoryMatchRank('천호동(지)', '천호동')).toBe(0);
    expect(directoryMatchRank('답동 주교좌', '답동')).toBe(0);
    expect(directoryMatchRank('서귀복자', '서귀')).toBe(1);
    expect(directoryMatchRank('새서귀포 성 푸코', '서귀포')).toBe(2);
    expect(directoryMatchRank('강정공소', '서귀포')).toBe(3);
  });
});

describe('rankDirectoryResults', () => {
  it('이름이 같은 곳을 맨 앞에, 나머지는 받은 순서대로', () => {
    const rows = [
      { name: '강정공소' },
      { name: '새서귀포 성 푸코' },
      { name: '서귀포' },
      { name: '서귀복자' },
    ];
    expect(rankDirectoryResults(rows, '서귀포성당', 3).map((r) => r.name)).toEqual([
      '서귀포',
      '새서귀포 성 푸코',
      '강정공소',
    ]);
  });
});
