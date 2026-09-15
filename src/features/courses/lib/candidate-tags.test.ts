import { describe, expect, it } from 'vitest';
import { assignTags } from './candidate-tags';

describe('assignTags — 카드 태그 배정', () => {
  it('가까움 · 조용 · 자세함이 서로 다른 카드에 하나씩 붙는다', () => {
    const tags = assignTags([
      { distanceKm: 10, quality: 1, crowdingScore: 60 },
      { distanceKm: 20, quality: 2, crowdingScore: 10 },
      { distanceKm: 30, quality: 5, crowdingScore: 40 },
    ]);
    expect(tags).toEqual(['nearest', 'quiet', 'detailed']);
  });

  it('1위가 겹치면 가까움이 먼저 가져가고 조용은 다음 순위에게', () => {
    const tags = assignTags([
      { distanceKm: 10, quality: 5, crowdingScore: 5 }, // 가깝고 조용하고 자세함
      { distanceKm: 20, quality: 3, crowdingScore: 20 },
      { distanceKm: 30, quality: 1, crowdingScore: 50 },
    ]);
    expect(tags).toEqual(['nearest', 'quiet', 'detailed']);
  });

  it('1장이면 가까움만, 2장이면 가까움 + 하나', () => {
    expect(assignTags([{ distanceKm: 3, quality: 2, crowdingScore: 30 }])).toEqual(['nearest']);
    expect(
      assignTags([
        { distanceKm: 3, quality: 2, crowdingScore: 30 },
        { distanceKm: 9, quality: 0, crowdingScore: 10 },
      ]),
    ).toEqual(['nearest', 'quiet']);
  });

  it('붐빔 점수가 없는 카드는 조용 태그를 못 받고, 셋 다 없으면 조용 태그가 없다', () => {
    expect(
      assignTags([
        { distanceKm: 10, quality: 1, crowdingScore: null },
        { distanceKm: 20, quality: 2, crowdingScore: 15 },
        { distanceKm: 30, quality: 3, crowdingScore: null },
      ]),
    ).toEqual(['nearest', 'quiet', 'detailed']);
    expect(
      assignTags([
        { distanceKm: 10, quality: 1, crowdingScore: null },
        { distanceKm: 20, quality: 2, crowdingScore: null },
        { distanceKm: 30, quality: 3, crowdingScore: null },
      ]),
    ).toEqual(['nearest', null, 'detailed']);
  });

  it('소개 정보가 하나도 없는 곳에는 「자세해요」를 붙이지 않는다', () => {
    expect(
      assignTags([
        { distanceKm: 10, quality: 0, crowdingScore: null },
        { distanceKm: 20, quality: 0, crowdingScore: null },
      ]),
    ).toEqual(['nearest', null]);
  });
});
