import { describe, expect, it } from 'vitest';
import { assignTags } from './candidate-tags';

// 「인근이 조용해요」 태그는 붐빔 지수와 함께 뺐다(사장님 2026-11-27, 공모전 종료)
describe('assignTags — 카드 태그 배정', () => {
  it('가까움 · 자세함이 서로 다른 카드에 하나씩 붙는다', () => {
    const tags = assignTags([
      { distanceKm: 10, quality: 1 },
      { distanceKm: 20, quality: 2 },
      { distanceKm: 30, quality: 5 },
    ]);
    expect(tags).toEqual(['nearest', null, 'detailed']);
  });

  it('1위가 겹치면 가까움이 먼저 가져가고 자세함은 다음 순위에게', () => {
    const tags = assignTags([
      { distanceKm: 10, quality: 5 },
      { distanceKm: 20, quality: 3 },
      { distanceKm: 30, quality: 1 },
    ]);
    expect(tags).toEqual(['nearest', 'detailed', null]);
  });

  it('1장이면 가까움만', () => {
    expect(assignTags([{ distanceKm: 3, quality: 2 }])).toEqual(['nearest']);
  });

  it('소개가 하나도 없으면(품질 0) 자세함 태그를 붙이지 않는다', () => {
    expect(
      assignTags([
        { distanceKm: 10, quality: 0 },
        { distanceKm: 20, quality: 0 },
      ]),
    ).toEqual(['nearest', null]);
  });
});
